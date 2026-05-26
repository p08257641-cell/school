import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Users } from 'lucide-react';

interface JitsiVideoCallProps {
  channel: string;
  userName?: string;
  canEnd?: boolean;
  onClose: () => void;
  onForceEnd?: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const JitsiVideoCall: React.FC<JitsiVideoCallProps> = ({ channel, userName = 'User', canEnd = false, onClose, onForceEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [participantCount, setParticipantCount] = useState(1);

  useEffect(() => {
    // Sanitize channel name - remove special characters, convert to lowercase
    const sanitizedChannel = (channel || 'meeting')
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50); // Jitsi has a limit on room names

    console.log('Connecting to Jitsi channel:', sanitizedChannel);

    // Load Jitsi script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (containerRef.current && window.JitsiMeetExternalAPI) {
        const options = {
          roomName: sanitizedChannel,
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
            TOOLBAR_TIMEOUT: 4000,
          },
        };

        try {
          const api = new window.JitsiMeetExternalAPI('meet.jit.si', options);
          jitsiApiRef.current = api;

          console.log('Jitsi API initialized successfully');

          // Listen for participant changes
          api.addEventListener('participantsInfoChanged', (data: any) => {
            setParticipantCount(data.participants?.length + 1 || 1);
          });

          api.addEventListener('videoConferenceLeft', () => {
            console.log('User left the conference');
            onClose();
          });
        } catch (error) {
          console.error('Jitsi initialization error:', error);
          alert('Failed to initialize video meeting. Please try again.');
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load Jitsi script');
      alert('Failed to load Jitsi. Please check your internet connection.');
    };

    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (error) {
          console.error('Error disposing Jitsi API:', error);
        }
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
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
      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-900/50 backdrop-blur-md border-b border-white/10 gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div className="truncate">
            <h2 className="text-white font-bold truncate">{channel}</h2>
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
      <div ref={containerRef} className="flex-1 min-h-[60vh] md:min-h-[70vh]" />

      {/* Leave / End Buttons */}
      <div className="p-6 bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 flex flex-col gap-3 sm:flex-row items-center justify-center">
        {canEnd && onForceEnd && (
          <button
            onClick={onForceEnd}
            className="w-full sm:w-auto px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-rose-600/20"
          >
            End Meeting for Everyone
          </button>
        )}
        <button 
          onClick={handleLeave}
          className="w-full sm:w-auto px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-red-600/20"
        >
          <PhoneOff className="w-6 h-6" />
          <span className="ml-2 hidden sm:inline">Leave Meeting</span>
        </button>
      </div>
    </div>
  );
};
