const FITNESS_EPISODE_NUMBER_BY_GUID: Record<string, number> = {
  'bc8fe2c8-bc35-4022-9945-65d944e367ef': 1,
  '34f22f4c-9d12-4a9a-a2ca-db03841111f2': 2,
  '94f51bf3-5a8a-437a-9c80-4bfaf4a54b1a': 3,
  '4a4297c2-557a-4f1d-9283-c682ec786c17': 4,
  '929bc7f9-d4bc-4463-bae8-c948726e14b2': 5,
  'bf2d790c-cf7e-46f9-9070-b7683a1b49c0': 6,
  '45051bd9-ee0f-48b9-aad4-d40195e4c247': 7,
  'c437ac5b-0fa9-424c-be2f-88edf7613f70': 8,
  'a2b0a04f-0c44-4115-84db-02e5aa020630': 9,
  'c5960843-86ec-43b8-aece-72d5b8c0259f': 10,
  '3642d070-54b9-4b2f-8b2b-9f5c587fd25e': 11,
  'bbb8e967-d92f-4d98-9b5b-f07ecd08b82e': 12,
  '9e2391dd-ad4e-465e-ba7a-86dd88884d44': 13,
  '7730ef10-39fc-4ab3-b1fb-9b978aa2b40c': 14,
  '83dfcb01-6771-4aeb-991d-0325d452f047': 15,
  '109f28ea-5605-4786-bfad-1af29498275b': 16,
  '7ae04f2d-57f6-49ee-8361-37612e2df746': 17,
  'a85fa127-da9e-4468-80c4-79e5974fec18': 18,
  '10fb952a-e007-4fae-8e34-9ef5398a939a': 19,
  'd06b5c56-4188-44e6-8033-2dce2533eb52': 20,
  'e047fd67-5594-4bbb-8463-1bebb3504820': 21,
};

const mappedNumbers = Object.values(FITNESS_EPISODE_NUMBER_BY_GUID);
if (new Set(mappedNumbers).size !== mappedNumbers.length) {
  throw new Error('Fitness podcast GUID map contains duplicate episode numbers.');
}

export function getFitnessEpisodeNumber(guid: string): number | undefined {
  return FITNESS_EPISODE_NUMBER_BY_GUID[guid.trim().toLowerCase()];
}

export function getFitnessEpisodeSlug(guid: string, spotifyUrl: string): string {
  const episodeNumber = getFitnessEpisodeNumber(guid);
  if (episodeNumber) return `toft-${episodeNumber}`;

  const spotifyEpisodeId = spotifyUrl.match(/-([a-z0-9]+)\/?$/i)?.[1]?.toLowerCase();
  if (spotifyEpisodeId) return `toft-${spotifyEpisodeId}`;

  const stableGuid = guid.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  if (stableGuid) return `toft-${stableGuid}`;

  throw new Error('Fitness podcast item has no stable GUID or Spotify episode ID.');
}
