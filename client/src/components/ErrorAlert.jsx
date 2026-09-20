import React from 'react';
import { AlertOctagon, Clock, Key, RefreshCw, ExternalLink, Wifi } from 'lucide-react';

export default function ErrorAlert({ error, onRetry }) {
  if (!error) return null;

  const isRateLimit = error.isRateLimit || error.status === 429 || /429|limit|quota/i.test(error.message || '');
  const isApiKeyMissing = error.isApiKeyMissing || error.status === 401 || /key/i.test(error.message || '');
  const isHighDemand = !isRateLimit && !isApiKeyMissing &&
    (error.status === 503 || /503|demand|spike|temporary|overload/i.test(error.message || ''));

  const getBorderBg = () => {
    if (isRateLimit)    return { border: '1px solid rgba(255,213,30,0.35)',  backgroundColor: 'rgba(255,213,30,0.07)',  color: '#FFD51E' };
    if (isApiKeyMissing) return { border: '1px solid rgba(80,3,192,0.45)',   backgroundColor: 'rgba(80,3,192,0.1)',    color: '#b39ddb' };
    if (isHighDemand)   return { border: '1px solid rgba(171,3,169,0.4)',   backgroundColor: 'rgba(171,3,169,0.08)',  color: '#d0a0ff' };
    return                    { border: '1px solid rgba(255,70,122,0.4)',   backgroundColor: 'rgba(255,70,122,0.08)', color: '#FF467A' };
  };

  const iconBg = isRateLimit
    ? 'rgba(255,213,30,0.15)' : isApiKeyMissing
    ? 'rgba(80,3,192,0.2)' : isHighDemand
    ? 'rgba(171,3,169,0.2)' : 'rgba(255,70,122,0.15)';

  const iconColor = isRateLimit ? '#FFD51E' : isApiKeyMissing ? '#AB03A9' : isHighDemand ? '#AB03A9' : '#FF467A';

  return (
    <div className="rounded-2xl p-5 shadow-lg" style={getBorderBg()}>
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}>
          {isRateLimit    ? <Clock      className="w-5 h-5" style={{ color: iconColor }} /> :
           isApiKeyMissing ? <Key       className="w-5 h-5" style={{ color: iconColor }} /> :
           isHighDemand    ? <Wifi      className="w-5 h-5 animate-pulse" style={{ color: iconColor }} /> :
                             <AlertOctagon className="w-5 h-5" style={{ color: iconColor }} />}
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-sm" style={{ color: '#f0e6ff' }}>
            {isRateLimit ? 'Rate Limit Reached'
              : isApiKeyMissing ? 'Gemini API Key Required'
              : isHighDemand ? 'Gemini Model Temporarily Busy'
              : 'Analysis Failed'}
          </h4>

          <p className="text-xs mt-1 leading-relaxed" style={{ color: '#b39ddb' }}>
            {isRateLimit
              ? 'Request limit reached, please wait a minute and try again. Gemini limits requests to 15 per minute.'
              : isHighDemand
              ? 'Gemini models are experiencing a brief demand spike right now. This is temporary — click Retry in a few seconds!'
              : error.message || 'An error occurred while contacting the Gemini service.'}
          </p>

          {isHighDemand && (
            <div className="mt-2.5 p-2.5 rounded-xl text-xs"
              style={{ backgroundColor: 'rgba(171,3,169,0.12)', border: '1px solid rgba(171,3,169,0.25)', color: '#d0a0ff' }}>
              💡 The backend automatically tries 4 different Flash models. If all are briefly busy, just wait ~10 seconds and retry.
            </div>
          )}

          {isApiKeyMissing && (
            <div className="mt-3 p-3 rounded-xl text-xs space-y-2"
              style={{ backgroundColor: 'rgba(10,0,21,0.8)', border: '1px solid rgba(80,3,192,0.3)', color: '#b39ddb' }}>
              <p>To configure your Gemini API key:</p>
              <ol className="list-decimal list-inside space-y-1" style={{ color: 'rgba(179,157,219,0.7)' }}>
                <li>Go to{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                    className="underline font-medium" style={{ color: '#FF467A' }}>
                    Google AI Studio
                  </a>{' '}and generate an API key.
                </li>
                <li>Open <code className="font-mono" style={{ color: '#AB03A9' }}>server/.env</code> and paste your key:</li>
              </ol>
              <div className="p-2 rounded text-[11px] font-mono"
                style={{ backgroundColor: '#0a0015', color: '#FFD51E' }}>
                GEMINI_API_KEY=AIzaSy...
              </div>
            </div>
          )}

          {onRetry && !isApiKeyMissing && (
            <div className="mt-3">
              <button type="button" onClick={onRetry}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ backgroundColor: 'rgba(80,3,192,0.3)', border: '1px solid rgba(80,3,192,0.5)', color: '#f0e6ff' }}>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Analysis</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
