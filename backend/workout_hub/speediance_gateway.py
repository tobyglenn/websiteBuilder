"""Minimal stateless Speediance API gateway used by the Workout Hub.

The provider API is unofficial. This client never writes credentials or response bodies to disk
and returns only the identifiers/data needed by the hub service.
"""

from __future__ import annotations

import time
from typing import Any
from urllib.parse import urlencode

import requests


class SpeedianceProviderError(RuntimeError):
    pass


class SpeedianceGateway:
    PREFERRED_COACH_ID = 31

    def __init__(self, auth: dict, session=None, timeout_seconds: int = 20):
        self.region = auth.get("region", "Global")
        self.device_type = int(auth.get("device_type", 1))
        self.token = str(auth.get("token") or "")
        self.app_user_id = str(auth.get("app_user_id") or "")
        self.host = "euapi.speediance.com" if self.region == "EU" else "api2.speediance.com"
        self.base_url = f"https://{self.host}"
        self.session = session or requests.Session()
        self.timeout_seconds = timeout_seconds

    def _headers(self, authenticated: bool = True) -> dict:
        headers = {
            "Host": self.host,
            "Timestamp": str(int(time.time() * 1000)),
            "Versioncode": "40304",
            "Mobiledevices": '{"brand":"google","device":"emulator64_x86_64_arm64","deviceType":"sdk_gphone64_x86_64","os":"","os_version":"31","manufacturer":"Google"}',
            "Content-Type": "application/json",
            "User-Agent": "Dart/3.9 (dart:io)",
            "App_type": "SOFTWARE",
            "Accept-Language": "en",
        }
        if authenticated:
            headers["App_user_id"] = self.app_user_id
            headers["Token"] = self.token
        return headers

    def _request(self, method: str, path: str, *, authenticated: bool = True, **kwargs):
        try:
            response = self.session.request(
                method,
                f"{self.base_url}{path}",
                headers=self._headers(authenticated),
                timeout=self.timeout_seconds,
                **kwargs,
            )
        except requests.RequestException as exc:
            raise SpeedianceProviderError("Speediance is temporarily unreachable") from exc
        if response.status_code in {401, 403}:
            raise SpeedianceProviderError("Speediance connection expired; reconnect your account")
        if response.status_code < 200 or response.status_code >= 300:
            raise SpeedianceProviderError("Speediance rejected the request")
        try:
            payload = response.json()
        except (TypeError, ValueError) as exc:
            raise SpeedianceProviderError("Speediance returned an unreadable response") from exc
        if isinstance(payload, dict) and payload.get("code") not in {None, 0}:
            raise SpeedianceProviderError("Speediance rejected the request")
        return payload

    def login(self, email: str, password: str) -> dict:
        verify = self._request(
            "POST", "/api/app/v2/login/verifyIdentity", authenticated=False,
            json={"type": 2, "userIdentity": email},
        ).get("data", {})
        if verify.get("isExist") is False or verify.get("hasPwd") is False:
            raise SpeedianceProviderError("Invalid Speediance credentials")
        try:
            response = self._request(
                "POST", "/api/app/v2/login/byPass", authenticated=False,
                json={"userIdentity": email, "password": password, "type": 2},
            )
        except SpeedianceProviderError as exc:
            raise SpeedianceProviderError("Invalid Speediance credentials") from exc
        data = response.get("data", {})
        if not data.get("token") or not data.get("appUserId"):
            raise SpeedianceProviderError("Invalid Speediance credentials")
        self.token = str(data["token"])
        self.app_user_id = str(data["appUserId"])
        return {
            "token": self.token,
            "app_user_id": self.app_user_id,
            "region": self.region,
            "device_type": self.device_type,
        }

    def confirm_account_unit(self, unit: int) -> int:
        unit = int(unit)
        if unit not in {0, 1}:
            raise SpeedianceProviderError("Unsupported Speediance account unit")
        self._request("PUT", "/api/app/userinfo", json={"unit": unit})
        return unit

    def _get_batch_details(self, group_ids: list[int]) -> list[dict]:
        query = urlencode([("ids", group_id) for group_id in group_ids])
        return self._request("GET", f"/api/app/actionLibraryGroup/list?{query}").get("data", [])

    def _is_unilateral(self, group_id: int) -> bool:
        detail = self._request("GET", f"/api/app/actionLibraryGroup/{group_id}?isDisplay=1").get("data", {})
        return int(detail.get("isLeftRight") or 0) == 1

    @classmethod
    def _variant_id(cls, detail: dict) -> int | None:
        variants = detail.get("actionLibraryList") or []
        for variant in variants:
            coach = variant.get("coach") or {}
            if variant.get("coachId") == cls.PREFERRED_COACH_ID or coach.get("id") == cls.PREFERRED_COACH_ID:
                return variant.get("id")
        return variants[0].get("id") if variants else None

    def get_user_workouts(self) -> list[dict]:
        path = f"/api/app/v4/customTrainingTemplate/appPage?pageNo=1&pageSize=-1&deviceTypes={self.device_type}"
        return self._request("GET", path).get("data", [])

    def save_workout(self, name: str, exercises: list[dict]) -> dict:
        group_ids = sorted({int(exercise["groupId"]) for exercise in exercises})
        details = self._get_batch_details(group_ids)
        details_by_group = {int(detail["id"]): detail for detail in details}
        variants = {int(detail["id"]): self._variant_id(detail) for detail in details}
        unilateral = {group_id: self._is_unilateral(group_id) for group_id in group_ids}
        actions = []
        total_capacity = 0.0

        for exercise in exercises:
            group_id = int(exercise["groupId"])
            detail = details_by_group.get(group_id, {})
            variant_id = exercise.get("variant_id") or variants.get(group_id)
            if not variant_id:
                raise SpeedianceProviderError(f"Exercise {group_id} is not available on this Speediance account")
            preset = int(exercise.get("preset_id", -1))
            raw_data_stat_type = exercise.get("data_stat_type")
            data_stat_type = int(detail.get("dataStatType", 0))
            if (
                raw_data_stat_type is not None
                and int(raw_data_stat_type) != data_stat_type
            ):
                raise SpeedianceProviderError(
                    f"Exercise {group_id} metadata does not match Speediance"
                )
            completion_method = int(detail.get("completionMethod") or 0)
            select_completion_method = str(detail.get("selectCompletionMethod") or "")
            if completion_method == 2 or (
                completion_method == 0 and select_completion_method == "1"
            ):
                default_unit = "sec"
            elif completion_method == 5:
                default_unit = "kcal"
            else:
                default_unit = "reps"
            source_unit = int(exercise.get("source_unit", exercise.get("target_unit", 1)))
            target_unit = int(exercise.get("target_unit", source_unit))
            if source_unit not in {0, 1} or target_unit not in {0, 1}:
                raise SpeedianceProviderError("Unsupported workout weight unit")
            if preset not in {-1, 1, 3, 5}:
                raise SpeedianceProviderError(
                    f"Exercise {group_id} uses an unsupported preset"
                )
            preset_detail = None
            if preset != -1:
                preset_detail = next(
                    (
                        item
                        for item in detail.get("templatePresetList") or []
                        if int(item.get("id", -1)) == preset
                    ),
                    None,
                )
                if preset_detail is None:
                    raise SpeedianceProviderError(
                        f"Exercise {group_id} preset is not available on Speediance"
                    )
            fields = {key: [] for key in (
                "reps", "weights", "counter", "rest", "mode", "side", "level", "completion", "method", "count"
            )}
            exercise_capacity = 0.0
            for index, item in enumerate(exercise.get("sets") or []):
                reps = int(item.get("reps") or 0)
                weight = float(item.get("weight") or 0)
                mode = int(item.get("mode") or 1)
                rest = int(item.get("rest") or 60)
                unit = str(item.get("unit") or default_unit).lower()
                if mode not in {1, 2, 3}:
                    raise SpeedianceProviderError(
                        f"Exercise {group_id} uses an unsupported resistance mode"
                    )
                if data_stat_type == 6 and (
                    not weight.is_integer() or weight < 1 or weight > 10
                ):
                    raise SpeedianceProviderError(
                        f"Exercise {group_id} Vita level must be between 1 and 10"
                    )
                if data_stat_type != 6 and preset == -1:
                    source_max = 100.0 if source_unit == 0 else 220.0
                    if weight > source_max:
                        raise SpeedianceProviderError(
                            f"Exercise {group_id} exceeds the device weight limit"
                        )
                if preset_detail is not None:
                    counter_min = preset_detail.get("weightScopeStart")
                    counter_max = preset_detail.get("weightScopeEnd")
                    if (
                        counter_min is None
                        or counter_max is None
                        or not weight.is_integer()
                        or weight < int(counter_min)
                        or weight > int(counter_max)
                    ):
                        raise SpeedianceProviderError(
                            f"Exercise {group_id} preset counter is outside Speediance limits"
                        )
                if data_stat_type != 6 and preset == -1 and source_unit != target_unit:
                    weight = (
                        round(weight / 2.2046226218, 2)
                        if source_unit == 1
                        else round(weight * 2.2046226218, 2)
                    )
                if data_stat_type != 6 and preset == -1:
                    target_max = 100.0 if target_unit == 0 else 220.0
                    if weight > target_max:
                        raise SpeedianceProviderError(
                            f"Exercise {group_id} exceeds the device weight limit"
                        )
                fields["reps"].append(str(reps))
                fields["rest"].append(str(rest))
                fields["mode"].append(str(mode))
                fields["side"].append("1" if unilateral[group_id] and index % 2 == 0 else "2" if unilateral[group_id] else "0")
                if data_stat_type == 6:
                    fields["level"].append(str(max(1, min(10, int(weight) or 1))))
                else:
                    fields["level"].append("0")
                fields["completion"].append("1")
                fields["method"].append("2" if unit == "sec" else "1")
                fields["count"].append("2" if unit == "sec" else "1")
                if data_stat_type == 6:
                    fields["weights"].append("0")
                elif preset == -1:
                    fields["weights"].append(f"{weight:.1f}")
                    exercise_capacity += reps * weight
                else:
                    fields["weights"].append("3.5")
                    fields["counter"].append(str(int(weight)))
                    exercise_capacity += reps * weight * 2.2
            if not fields["reps"]:
                raise SpeedianceProviderError(f"Exercise {group_id} has no sets")
            total_capacity += exercise_capacity
            counter = ",".join(fields["counter"]) if preset != -1 else ""
            actions.append({
                "groupId": group_id,
                "actionLibraryId": int(variant_id),
                "templatePresetId": preset,
                "setsAndReps": ",".join(fields["reps"]),
                "breakTime": ",".join(fields["rest"]),
                "breakTime2": ",".join(fields["rest"]),
                "sportMode": ",".join(fields["mode"]),
                "leftRight": ",".join(fields["side"]),
                "selectCompletionMethod": ",".join(fields["completion"]),
                "completionMethod": ",".join(fields["method"]),
                "countType": ",".join(fields["count"]),
                "weights": ",".join(fields["weights"]),
                "counterweight2": counter,
                "counterweight": counter,
                "level": ",".join(fields["level"]),
                "capacity": exercise_capacity,
            })

        self._request("POST", "/api/app/v2/customTrainingTemplate", json={
            "name": name,
            "actionLibraryList": actions,
            "totalCapacity": total_capacity,
            "deviceType": self.device_type,
            "bgColor": 0,
        })
        matches = [workout for workout in self.get_user_workouts() if str(workout.get("name") or "") == name]
        if not matches:
            raise SpeedianceProviderError("Workout was saved but could not be found on the account")
        latest = max(matches, key=lambda workout: int(workout.get("id") or 0))
        return {"template_id": latest.get("id"), "template_code": latest.get("code")}

    def get_training_records(self, start_date: str, end_date: str) -> list[dict]:
        query = urlencode({"startDate": start_date, "endDate": end_date})
        return self._request("GET", f"/api/mobile/v2/report/userTrainingDataRecord?{query}").get("data", [])
