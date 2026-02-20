import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Users
} from 'lucide-react';
import './VideoCall.css';

const VideoCall = ({ channelName, appId, token, onEndCall }) => {
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(true); // Camera off by default
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
            try {
                await client.subscribe(user, mediaType);
                
                setRemoteUsers(prev => {
                    const existingUser = prev.find(u => u.uid === user.uid);
                    if (existingUser) {
                        // Update existing user with new track info
                        const updatedUser = { ...existingUser };
                        if (mediaType === 'audio') {
                            updatedUser.audioTrack = user.audioTrack;
                            updatedUser.hasAudio = true;
                        }
                        if (mediaType === 'video') {
                            updatedUser.videoTrack = user.videoTrack;
                            updatedUser.hasVideo = true;
                        }
                        return prev.map(u => u.uid === user.uid ? updatedUser : u);
                    } else {
                        // Add new user
                        const newUser = {
                            ...user,
                            hasAudio: mediaType === 'audio',
                            hasVideo: mediaType === 'video'
                        };
                        return [...prev, newUser];
                    }
                });

                if (mediaType === 'audio' && user.audioTrack) {
                    user.audioTrack.play();
                }
            } catch (error) {
                console.error(`Error subscribing to user ${user.uid} ${mediaType}:`, error);
            }
        });

        client.on('user-unpublished', (user, mediaType) => {
            if (mediaType === 'video') {
                setRemoteUsers(prev => 
                    prev.map(u => 
                        u.uid === user.uid 
                            ? { ...u, videoTrack: null, hasVideo: false }
                            : u
                    )
                );
            } else if (mediaType === 'audio') {
                setRemoteUsers(prev => 
                    prev.map(u => 
                        u.uid === user.uid 
                            ? { ...u, audioTrack: null, hasAudio: false }
                            : u
                    )
                );
            }
        });

        client.on('user-left', (user) => {
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        client.on('user-joined', (user) => {
            // When a user joins, we should check if they have published tracks
            console.log('User joined:', user.uid);
        });

        const joinChannel = async () => {
            try {
                const uid = Math.floor(Math.random() * 100000);
                await client.join(appId, channelName, token, uid);
                if (aborted) { client.leave().catch(() => {}); return; }

                // Check for existing remote users in the channel and subscribe to their tracks
                const remoteUsersList = client.remoteUsers || [];
                if (remoteUsersList.length > 0) {
                    // Initialize remote users list
                    const initialUsers = remoteUsersList.map(user => ({ ...user }));
                    setRemoteUsers(initialUsers);
                    
                    // Subscribe to existing users' published tracks
                    for (const user of remoteUsersList) {
                        try {
                            if (user.hasAudio) {
                                await client.subscribe(user, 'audio');
                            }
                            if (user.hasVideo) {
                                await client.subscribe(user, 'video');
                            }
                        } catch (subError) {
                            console.warn(`Failed to subscribe to user ${user.uid}:`, subError);
                        }
                    }
                }

                audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                if (aborted) { audioTrack.close(); client.leave().catch(() => {}); return; }

                localAudioTrackRef.current = audioTrack;

                // Publish only audio track initially (voice call only)
                // Don't create video track until user wants to turn on camera
                await client.publish([audioTrack]);
                if (aborted) { audioTrack.close(); client.leave().catch(() => {}); return; }

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
            // Also close tracks from refs
            if (localAudioTrackRef.current) {
                localAudioTrackRef.current.close();
                localAudioTrackRef.current = null;
            }
            if (localVideoTrackRef.current) {
                localVideoTrackRef.current.close();
                localVideoTrackRef.current = null;
            }
            // Always attempt to leave, even if join is still in progress
            client.leave().catch(() => {});
            clientRef.current = null;
            setJoined(false);
            setRemoteUsers([]);
        };
    }, [appId, channelName, token]);

    // Play local video when camera is turned on
    useEffect(() => {
        if (!isVideoOff && localVideoTrackRef.current && localVideoRef.current) {
            try {
                const playPromise = localVideoTrackRef.current.play(localVideoRef.current);
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(err => {
                        console.warn("Failed to play local video:", err);
                    });
                }
            } catch (err) {
                console.warn("Error playing local video:", err);
            }
        }
    }, [isVideoOff]);

    // Play remote videos when they change
    useEffect(() => {
        remoteUsers.forEach(user => {
            if (user.videoTrack) {
                const container = document.getElementById(`remote-video-${user.uid}`);
                if (container) {
                    // Clear container first to avoid duplicate video elements
                    container.innerHTML = '';
                    try {
                        user.videoTrack.play(container).catch(err => {
                            console.warn(`Failed to play video for user ${user.uid}:`, err);
                        });
                    } catch (err) {
                        console.warn(`Error playing video for user ${user.uid}:`, err);
                    }
                }
            }
            if (user.audioTrack) {
                try {
                    if (!user.audioTrack.isPlaying) {
                        user.audioTrack.play().catch(err => {
                            console.warn(`Failed to play audio for user ${user.uid}:`, err);
                        });
                    }
                } catch (err) {
                    console.warn(`Error playing audio for user ${user.uid}:`, err);
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

    const toggleVideo = async () => {
        if (!clientRef.current) return;
        
        try {
            const newIsVideoOff = !isVideoOff;
            
            if (newIsVideoOff) {
                // Turning camera OFF
                if (localVideoTrackRef.current) {
                    // Disable the track and unpublish it
                    localVideoTrackRef.current.setEnabled(false);
                    await clientRef.current.unpublish([localVideoTrackRef.current]);
                    // Close the track to release camera
                    localVideoTrackRef.current.close();
                    localVideoTrackRef.current = null;
                }
                setIsVideoOff(true);
            } else {
                // Turning camera ON - Create video track if it doesn't exist
                if (!localVideoTrackRef.current) {
                    try {
                        const videoTrack = await AgoraRTC.createCameraVideoTrack();
                        localVideoTrackRef.current = videoTrack;
                        
                        // Publish the video track
                        await clientRef.current.publish([videoTrack]);
                        
                        // Play video locally
                        if (localVideoRef.current) {
                            const playPromise = videoTrack.play(localVideoRef.current);
                            if (playPromise && typeof playPromise.catch === 'function') {
                                playPromise.catch(err => {
                                    console.warn("Failed to play video:", err);
                                });
                            }
                        }
                        
                        setIsVideoOff(false);
                    } catch (err) {
                        console.error("Failed to create video track:", err);
                        setIsVideoOff(true); // Keep camera off on error
                    }
                } else {
                    // Track already exists, just enable and publish
                    localVideoTrackRef.current.setEnabled(true);
                    await clientRef.current.publish([localVideoTrackRef.current]);
                    setIsVideoOff(false);
                    
                    // Play video locally
                    if (localVideoRef.current) {
                        const playPromise = localVideoTrackRef.current.play(localVideoRef.current);
                        if (playPromise && typeof playPromise.catch === 'function') {
                            playPromise.catch(err => {
                                console.warn("Failed to play video:", err);
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.warn("Error toggling video:", err);
            // Revert state on error
            setIsVideoOff(isVideoOff);
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
                <div className={`video-player local ${remoteUsers.length === 0 ? 'solo' : ''} ${isVideoOff ? 'video-off' : ''}`}>
                    <div ref={localVideoRef} style={{ width: '100%', height: '100%' }} />
                    {isVideoOff && (
                        <div className="video-off-overlay">
                            <div className="avatar-placeholder">
                                <span>You</span>
                            </div>
                        </div>
                    )}
                    <div className="video-status-bar">
                        <span className="video-label">You</span>
                        <div className="status-indicators">
                            {isMuted && (
                                <div className="status-badge muted">
                                    <MicOff size={14} />
                                </div>
                            )}
                            {isVideoOff && (
                                <div className="status-badge video-off">
                                    <VideoOff size={14} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {remoteUsers.map(user => (
                    <div key={user.uid} className={`video-player remote ${!user.videoTrack ? 'video-off' : ''}`}>
                        <div
                            id={`remote-video-${user.uid}`}
                            style={{ width: '100%', height: '100%' }}
                        />
                        {!user.videoTrack && (
                            <div className="video-off-overlay">
                                <div className="avatar-placeholder">
                                    <span>{String(user.uid).slice(-2)}</span>
                                </div>
                            </div>
                        )}
                        <div className="video-status-bar">
                            <span className="video-label">User {user.uid}</span>
                            <div className="status-indicators">
                                {(!user.audioTrack || !user.hasAudio) && (
                                    <div className="status-badge muted">
                                        <MicOff size={14} />
                                    </div>
                                )}
                                {(!user.videoTrack || !user.hasVideo) && (
                                    <div className="status-badge video-off">
                                        <VideoOff size={14} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="video-call-controls">
                <button
                    className={`control-btn mic-btn ${isMuted ? 'active' : ''}`}
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    className={`control-btn video-btn ${isVideoOff ? 'active' : ''}`}
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
                    <PhoneOff size={22} />
                </button>
            </div>
        </div>
    );
};

export default VideoCall;
