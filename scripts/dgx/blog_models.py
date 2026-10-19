"""Pinned editorial models, with account recovery within the same Google API.

Configured credentials only. No model, provider, or service substitution.
"""
from urllib.parse import urlparse


def call_pinned_model(model, request, call_model):
    if not model.startswith('google/'):
        return call_model(model, request['prompt'], timeout=request['timeout'], max_tokens=request['max_tokens'], system='Return complete JSON. Keep deliberation brief; reserve enough output for the complete requested object.'), None
    from freecall.runner import _load_providers, _resolve_key, _call_google
    return call_google_accounts(model,request,_load_providers(),_resolve_key,_call_google)


def call_google_accounts(model,request,providers,resolve_key,call_google):
    result=None
    for account in ('google','google-2'):
        block=providers.get(account,{})
        if not block:continue
        parsed=urlparse(block.get('baseUrl',''))
        if block.get('api')!='google-generative-ai' or parsed.scheme!='https' or parsed.hostname!='generativelanguage.googleapis.com' or parsed.port not in (None,443) or parsed.username or parsed.query or parsed.fragment or parsed.path.rstrip('/') not in ('','/v1','/v1beta'):
            raise ValueError('Configured Google account is not the pinned Google service')
        key=resolve_key(account,block.get('apiKey',''))
        if not key:continue
        endpoint='https://generativelanguage.googleapis.com'+(parsed.path.rstrip('/') or '/v1beta')
        # The account alias does not change the provider or requested model.
        result=call_google('google',endpoint,key,model.split('/',1)[1],request['prompt'],request['timeout'])
        if result.ok:return result,account
        status=(result.raw or {}).get('__http_status__')
        if status not in (429,503):return result,account
    if result is None:raise ValueError('No configured Google credential is available')
    return result,account
