import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Users
} from 'lucide-react';
import './VideoCall.css';

const VideoCall = ({ channelName, appId, token, onEndCall }) => {
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [joined, setJoined] = useState(false);

    const clientRef = useRef(null);
    const localAudioTrackRef = useRef(null);
    const localVideoTrackRef = useRef(null);
    const localVideoRef = useRef(null);

    useEffect(() => {
        // Closure variable - survives across async awaits, set by cleanup
        let aborted = false;

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        // Local track references within this effect closure
        let audioTrack = null;
        let videoTrack = null;

        client.on('user-published', async (user, mediaType) => {
            if (aborted) return;
            await client.subscribe(user, mediaType);
            if (mediaType === 'video') {
                setRemoteUsers(prev => {
                    const filtered = prev.filter(u => u.uid !== user.uid);
                    return [...filtered, user];
                });
            }
            if (mediaType === 'audio') {
                user.audioTrack?.play();
            }
        });

        client.on('user-unpublished', (user, mediaType) => {
            if (mediaType === 'video') {
                setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
            }
        });

        client.on('user-left', (user) => {
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        const joinChannel = async () => {
            try {
                const uid = Math.floor(Math.random() * 100000);
                await client.join(appId, channelName, token, uid);
                if (aborted) { client.leave().catch(() => {}); return; }

                audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                if (aborted) { audioTrack.close(); client.leave().catch(() => {}); return; }

                videoTrack = await AgoraRTC.createCameraVideoTrack();
                if (aborted) { videoTrack.close(); audioTrack.close(); client.leave().catch(() => {}); return; }

                localAudioTrackRef.current = audioTrack;
                localVideoTrackRef.current = videoTrack;

                await client.publish([audioTrack, videoTrack]);
                if (aborted) { videoTrack.close(); audioTrack.close(); client.leave().catch(() => {}); return; }

                if (localVideoRef.current) {
                    videoTrack.play(localVideoRef.current);
                }
                setJoined(true);
            } catch (error) {
                if (!aborted) {
                    console.error("Failed to join video call:", error);
                }
            }
        };

        joinChannel();

        // Cleanup: runs on unmount (including React Strict Mode remount)
        return () => {
            aborted = true;
            // Close tracks from this effect's closure
            if (audioTrack) { audioTrack.close(); audioTrack = null; }
            if (videoTrack) { videoTrack.close(); videoTrack = null; }
            localAudioTrackRef.current = null;
            localVideoTrackRef.current = null;
            // Always attempt to leave, even if join is still in progress
            client.leave().catch(() => {});
            clientRef.current = null;
            setJoined(false);
            setRemoteUsers([]);
        };
    }, [appId, channelName, token]);

    // Play remote videos when they change
    useEffect(() => {
        remoteUsers.forEach(user => {
            if (user.videoTrack) {
                const container = document.getElementById(`remote-video-${user.uid}`);
                if (container && !container.hasChildNodes()) {
                    user.videoTrack.play(container);
                }
            }
        });
    }, [remoteUsers]);

    const toggleMute = () => {
        if (localAudioTrackRef.current) {
            localAudioTrackRef.current.setEnabled(isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localVideoTrackRef.current) {
            localVideoTrackRef.current.setEnabled(isVideoOff);
            setIsVideoOff(!isVideoOff);
        }
    };

    const handleEndCall = async () => {
        if (localAudioTrackRef.current) {
            localAudioTrackRef.current.close();
            localAudioTrackRef.current = null;
        }
        if (localVideoTrackRef.current) {
            localVideoTrackRef.current.close();
            localVideoTrackRef.current = null;
        }
        if (clientRef.current) {
            await clientRef.current.leave().catch(() => {});
            clientRef.current = null;
        }
        setJoined(false);
        onEndCall();
    };

    return (
        <div className="video-call-overlay">
            <div className="video-call-header">
                <h3>Video Call</h3>
                <div className="participant-count">
                    <Users size={16} />
                    <span>{remoteUsers.length + 1} participant{remoteUsers.length !== 0 ? 's' : ''}</span>
                </div>
            </div>

            <div className="video-call-content">
                <div className={`video-player local ${remoteUsers.length === 0 ? 'solo' : ''}`}>
                    <div ref={localVideoRef} style={{ width: '100%', height: '100%' }} />
                    <span className="video-label">You</span>
                </div>

                {remoteUsers.map(user => (
                    <div key={user.uid} className="video-player remote">
                        <div
                            id={`remote-video-${user.uid}`}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                ))}
            </div>

            <div className="video-call-controls">
                <button
                    className={`control-btn ${isMuted ? 'active' : ''}`}
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    className={`control-btn ${isVideoOff ? 'active' : ''}`}
                    onClick={toggleVideo}
                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                <button
                    className="control-btn end-call"
                    onClick={handleEndCall}
                    title="End Call"
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
};

export default VideoCall;
