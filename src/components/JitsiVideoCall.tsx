import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Users } from 'lucide-react';

interface JitsiVideoCallProps {
  channel: string;
  userName?: string;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const JitsiVideoCall: React.FC<JitsiVideoCallProps> = ({ channel, userName = 'User', onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [participantCount, setParticipantCount] = useState(1);

  useEffect(() => {
    // Load Jitsi script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (containerRef.current && window.JitsiMeetExternalAPI) {
        const options = {
          roomName: channel,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: {
            displayName: userName,
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableProfile: true,
            doNotFloor: false,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
          },
        };

        try {
          const api = new window.JitsiMeetExternalAPI('meet.jit.si', options);
          jitsiApiRef.current = api;

          // Listen for participant changes
          api.addEventListener('participantsInfoChanged', (data: any) => {
            setParticipantCount(data.participants?.length + 1 || 1);
          });

          api.addEventListener('videoConferenceLeft', () => {
            onClose();
          });
        } catch (error) {
          console.error('Jitsi initialization error:', error);
        }
      }
    };

    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (error) {
          console.error('Error disposing Jitsi API:', error);
        }
      }
      document.body.removeChild(script);
    };
  }, [channel, userName, onClose]);

  const handleLeave = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-bold">{channel}</h2>
            <p className="text-zinc-400 text-xs">{participantCount} Participants</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-red-500/50 animate-pulse">
            Live
          </div>
        </div>
      </div>

      {/* Jitsi Container */}
      <div ref={containerRef} className="flex-1" />

      {/* Leave Button */}
      <div className="p-6 bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-center">
        <button 
          onClick={handleLeave}
          className="w-16 h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-red-600/20"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
