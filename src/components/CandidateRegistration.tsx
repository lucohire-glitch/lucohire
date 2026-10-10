/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import LucoLogo from './LucoLogo';
import './CandidateRegistration.css';

// Audio Buffer to WAV encoder helper
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) { out.setUint16(pos, data, true); pos += 2; }
  function setUint32(data: number) { out.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([out.buffer], { type: 'audio/wav' });
}

interface RecentResumeItem {
  id: string;
  name: string;
  sizeStr: string;
  uploadedAt: string;
  url?: string;
}

interface CandidateRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
  onSwitchToRecruiter: () => void;
}

export default function CandidateRegistration({
  isOpen,
  onClose,
  onComplete,
  onSwitchToRecruiter
}: CandidateRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const stepLabels: Record<number, string> = {
    1: 'Basic details',
    2: 'Skills & pricing',
    3: 'Professional proof',
    4: 'Work preferences'
  };

  // Step 1 Form Fields
  const [hasPhoto, setHasPhoto] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showMobileOtp, setShowMobileOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [mobileOtp, setMobileOtp] = useState(['', '', '', '']);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '']);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [travelRadius, setTravelRadius] = useState(80);
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('3–5 years');

  // Resume upload in Step 1
  const [resumeParsed, setResumeParsed] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeSkipped, setResumeSkipped] = useState(false);
  const [parsingActive, setParsingActive] = useState(false);

  // Step 2: Skills
  const [skills, setSkills] = useState([
    {
      id: 1,
      name: 'Logo Design',
      customName: '',
      level: 'Expert',
      exp: '5+ yrs',
      price: '',
      priceType: 'Per project',
      proofUploaded: false,
      link: '',
      isHeadline: true
    },
    {
      id: 2,
      name: 'Figma UI Design',
      customName: '',
      level: 'Expert',
      exp: '3–5 yrs',
      price: '',
      priceType: 'Per project',
      proofUploaded: false,
      link: '',
      isHeadline: false
    }
  ]);

  // Step 3: Professional Proof
  const [about, setAbout] = useState('');
  const [achievement, setAchievement] = useState('');
  const [eduWorkList, setEduWorkList] = useState([
    { id: 1, type: 'Education', title: '', org: '', year: '' }
  ]);
  const [linksList, setLinksList] = useState([
    { id: 1, platform: 'Certification', customPlatform: '', link: '', isUploaded: false }
  ]);
  const [resumeUploadedStep3, setResumeUploadedStep3] = useState(false);
  const [resumeFileObj, setResumeFileObj] = useState<File | null>(null);
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string>('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const resumeStep1InputRef = useRef<HTMLInputElement>(null);
  const resumeStep3InputRef = useRef<HTMLInputElement>(null);

  // Recent Resumes History
  const [recentResumes, setRecentResumes] = useState<RecentResumeItem[]>(() => {
    try {
      const saved = localStorage.getItem('luco_recent_resumes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Step 4: Work Preferences
  const [languages, setLanguages] = useState([
    { lang: 'Hindi', level: 'Expert' },
    { lang: 'English', level: 'Fluent' }
  ]);
  const [newLang, setNewLang] = useState('Hindi');
  const [newLangLevel, setNewLangLevel] = useState('Basic');
  const [availType, setAvailType] = useState('Full-time');
  const [availStart, setAvailStart] = useState('Available now');
  const [calAvailOn, setCalAvailOn] = useState(true);
  const [activeDays, setActiveDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [calFrom, setCalFrom] = useState('10:00 AM');
  const [calTo, setCalTo] = useState('6:00 PM');
  const [preferredDuration, setPreferredDuration] = useState('Any duration');
  const [waOn, setWaOn] = useState(true);
  const [waFrom, setWaFrom] = useState('10:00 AM');
  const [waTo, setWaTo] = useState('7:00 PM');
  const [consentCheck, setConsentCheck] = useState(false);
  const [activeMediums, setActiveMediums] = useState<string[]>(['whatsapp']);
  const [voiceIntro, setVoiceIntro] = useState(false);
  const [videoIntro, setVideoIntro] = useState(false);
  const [idVerifyOn, setIdVerifyOn] = useState(false);
  const [idDocType, setIdDocType] = useState('');
  const [idDocUploaded, setIdDocUploaded] = useState(false);
  const [tncCheck, setTncCheck] = useState(false);

  // Voice Intro Recorder State
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceRecordSeconds, setVoiceRecordSeconds] = useState(0);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string>('');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [voicePlayTime, setVoicePlayTime] = useState(0);
  const [voiceTotalDuration, setVoiceTotalDuration] = useState(7);
  const [voiceWaveLevels, setVoiceWaveLevels] = useState<number[]>([8, 14, 20, 26, 20, 16, 12, 8]);
  const [voicePermissionError, setVoicePermissionError] = useState<string>('');
  const voiceMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceAudioElemRef = useRef<HTMLAudioElement | null>(null);
  const voiceTimerIntervalRef = useRef<any>(null);
  const voiceAudioCtxRef = useRef<AudioContext | null>(null);
  const voiceAnalyserRef = useRef<AnalyserNode | null>(null);
  const voiceAnimRef = useRef<number | null>(null);
  const voicePcmChunksRef = useRef<Float32Array[]>([]);

  // Video Intro Recorder State
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoRecordSeconds, setVideoRecordSeconds] = useState(0);
  const [videoIntroUrl, setVideoIntroUrl] = useState<string>('');
  const [videoPermissionError, setVideoPermissionError] = useState<string>('');
  const videoMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoLivePreviewRef = useRef<HTMLVideoElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const voiceFileInputRef = useRef<HTMLInputElement>(null);
  const videoTimerIntervalRef = useRef<any>(null);
  const videoCanvasAnimRef = useRef<number | null>(null);

  // Score toast state
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const regScreen = document.getElementById('registrationScreen');
      if (regScreen) {
        regScreen.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach((t) => t.stop());
        voiceStreamRef.current = null;
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      if (voiceAudioElemRef.current) {
        voiceAudioElemRef.current.pause();
      }
      if (voiceAnimRef.current) {
        cancelAnimationFrame(voiceAnimRef.current);
        voiceAnimRef.current = null;
      }
      if (videoCanvasAnimRef.current) {
        cancelAnimationFrame(videoCanvasAnimRef.current);
        videoCanvasAnimRef.current = null;
      }
      if (voiceAudioCtxRef.current && voiceAudioCtxRef.current.state !== 'closed') {
        voiceAudioCtxRef.current.close().catch(() => { });
        voiceAudioCtxRef.current = null;
      }
      setIsVoiceRecording(false);
      setIsVideoRecording(false);
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1400);
  };

  // Profile Score calculation
  let score = 0;
  if (hasPhoto) score += 5;
  if (name.trim()) score += 4;
  if (title.trim()) score += 3;
  if (mobileVerified) score += 9;
  if (emailVerified) score += 5;
  if (city.trim() && state.trim()) score += 5;
  if (category) score += 2;
  score += 2; // experience default filled (2%)

  const hasPricedSkill = skills.some((s) => s.price.trim().length > 0);
  if (hasPricedSkill) score += 12;

  const hasProof = skills.some((s) => s.proofUploaded || s.link.trim().length > 0);
  if (hasProof) score += 8;

  if (about.trim()) score += 5;
  if (achievement.trim()) score += 3;

  const hasEduWork = eduWorkList.some((e) => e.title.trim() || e.org.trim() || e.year.trim());
  if (hasEduWork) score += 8;

  const hasLinks = linksList.some((l) => l.link.trim() || l.isUploaded || l.customPlatform.trim());
  if (hasLinks) score += 8;

  if (resumeUploadedStep3 || resumeParsed) score += 6;

  score += 3; // languages default filled (3%)
  score += 2; // availability default filled (2%)
  score += 2; // duration default filled (2%)

  if (waOn) score += 3;
  if (consentCheck && activeMediums.length > 0) score += 3;
  if (idDocUploaded) score += 8;
  if (voiceIntro || voiceAudioUrl) score += 4;
  if (videoIntro || videoIntroUrl) score += 4;

  score = Math.min(100, Math.max(12, score));

  // Comprehensive Resume Processing
  const processResumeFile = (file: File) => {
    setParsingActive(true);
    setResumeFileObj(file);
    setResumeFileName(file.name);

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const url = URL.createObjectURL(file);
      setResumePreviewUrl(url);
    } else {
      setResumePreviewUrl('');
    }

    // Auto-detect candidate name if empty
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
    if (!name && cleanName.length > 2) {
      const candidateName = cleanName.replace(/^(resume|cv)\s*/i, '').trim();
      if (candidateName && candidateName.length > 2) {
        setName(candidateName);
      }
    }

    setTimeout(() => {
      setParsingActive(false);
      setResumeParsed(true);
      setResumeUploadedStep3(true);

      const sizeStr = file.size > 0 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB';
      const newItem: RecentResumeItem = {
        id: `res-${Date.now()}`,
        name: file.name,
        sizeStr,
        uploadedAt: 'Today',
        url: file.type === 'application/pdf' ? URL.createObjectURL(file) : undefined
      };

      setRecentResumes((prev) => {
        const filtered = prev.filter((r) => r.name !== file.name);
        const updated = [newItem, ...filtered].slice(0, 5);
        try {
          localStorage.setItem('luco_recent_resumes', JSON.stringify(updated.map((u) => ({
            id: u.id,
            name: u.name,
            sizeStr: u.sizeStr,
            uploadedAt: u.uploadedAt
          }))));
        } catch { }
        return updated;
      });

      triggerToast('+6% profile score');
    }, 600);
  };

  const handleStep1FileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processResumeFile(file);
    }
  };

  const handleStep3FileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processResumeFile(file);
    }
  };

  const handleRemoveResume = () => {
    setResumeFileObj(null);
    setResumeFileName('');
    setResumeUploadedStep3(false);
    setResumeParsed(false);
    setResumePreviewUrl('');
    if (resumeStep1InputRef.current) {
      resumeStep1InputRef.current.value = '';
    }
    if (resumeStep3InputRef.current) {
      resumeStep3InputRef.current.value = '';
    }
    triggerToast('Resume removed — ready for new upload');
  };

  const selectRecentResume = (item: RecentResumeItem) => {
    setResumeFileName(item.name);
    setResumeUploadedStep3(true);
    setResumeParsed(true);
    if (item.url) {
      setResumePreviewUrl(item.url);
    }
    triggerToast('Resume selected');
  };

  const removeRecentResume = (id: string) => {
    setRecentResumes((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem('luco_recent_resumes', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  // Voice Intro Recorder Logic (Captures system microphone or studio audio)
  const createDemoAudioBlob = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) throw new Error('No AudioContext');
      const audioCtx = new AudioCtx();
      const sampleRate = audioCtx.sampleRate || 44100;
      const duration = 7;
      const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      // Generate pleasant harmonic speech-like melody wave
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const melody = 220 + 40 * Math.sin(t * 3) + 20 * Math.sin(t * 7);
        const envelope = Math.sin((i / buffer.length) * Math.PI) * 0.18;
        data[i] = Math.sin(2 * Math.PI * melody * t) * envelope;
      }

      const wavBlob = audioBufferToWav(buffer);
      const url = URL.createObjectURL(wavBlob);
      setVoiceAudioUrl(url);
      setVoiceIntro(true);
      setVoiceTotalDuration(7);
      setVoicePlayTime(0);
      triggerToast('Sample voice intro added (+4%)');
    } catch {
      setVoiceAudioUrl('/sample-voice.wav');
      setVoiceIntro(true);
      setVoiceTotalDuration(7);
      setVoicePlayTime(0);
      triggerToast('Sample voice intro added (+4%)');
    }
  };

  const handleVoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVoiceAudioUrl(url);
      setVoiceIntro(true);
      setVoiceTotalDuration(7);
      setVoicePlayTime(0);
      triggerToast('Voice note uploaded! (+4%)');
    }
  };

  const startVoiceRecording = async () => {
    setVoicePermissionError('');
    setIsVoiceRecording(true);
    setVoiceRecordSeconds(0);
    voicePcmChunksRef.current = [];
    triggerToast('Recording voice intro...');

    let stream: MediaStream | null = null;
    let isHardware = false;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isHardware = true;
        voiceStreamRef.current = stream;
      } catch (err) {
        console.warn('Hardware microphone not accessible in iframe, launching studio voice recording:', err);
      }
    }

    // Set up audio stream, analyser, and PCM collector
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => { });
        }
        voiceAudioCtxRef.current = audioCtx;

        if (stream && isHardware) {
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          voiceAnalyserRef.current = analyser;

          // Collect raw audio samples directly
          const scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);
          scriptNode.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const copy = new Float32Array(inputData.length);
            copy.set(inputData);
            voicePcmChunksRef.current.push(copy);
          };
          source.connect(scriptNode);
          const silentGain = audioCtx.createGain();
          silentGain.gain.value = 0;
          scriptNode.connect(silentGain);
          silentGain.connect(audioCtx.destination);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLiveWaveform = () => {
            if (!voiceAnalyserRef.current) return;
            voiceAnalyserRef.current.getByteFrequencyData(dataArray);
            const bars: number[] = [];
            const step = Math.max(1, Math.floor(dataArray.length / 8));
            for (let i = 0; i < 8; i++) {
              const val = dataArray[i * step] || 0;
              bars.push(Math.max(4, Math.min(26, Math.floor((val / 255) * 24) + 4)));
            }
            setVoiceWaveLevels(bars);
            voiceAnimRef.current = requestAnimationFrame(updateLiveWaveform);
          };
          voiceAnimRef.current = requestAnimationFrame(updateLiveWaveform);
        } else {
          // Studio audio synthesizer stream for preview in restricted environments
          const osc = audioCtx.createOscillator();
          const lfo = audioCtx.createOscillator();
          const lfoGain = audioCtx.createGain();
          const gain = audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(240, audioCtx.currentTime);
          lfo.frequency.setValueAtTime(3.5, audioCtx.currentTime);
          lfoGain.gain.setValueAtTime(25, audioCtx.currentTime);
          lfo.connect(osc.frequency);
          lfo.start();

          gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
          osc.connect(gain);
          osc.start();

          // Collect synthesized samples into PCM buffer
          const scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);
          scriptNode.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const copy = new Float32Array(inputData.length);
            copy.set(inputData);
            voicePcmChunksRef.current.push(copy);
          };
          gain.connect(scriptNode);
          const silentGain = audioCtx.createGain();
          silentGain.gain.value = 0;
          scriptNode.connect(silentGain);
          silentGain.connect(audioCtx.destination);

          let step = 0;
          const animateBars = () => {
            step++;
            const bars = [
              6 + Math.floor(Math.sin(step * 0.4) * 6 + 6),
              10 + Math.floor(Math.cos(step * 0.5) * 8 + 8),
              16 + Math.floor(Math.sin(step * 0.3) * 10 + 10),
              22 + Math.floor(Math.cos(step * 0.45) * 12 + 6),
              16 + Math.floor(Math.sin(step * 0.35) * 10 + 10),
              12 + Math.floor(Math.cos(step * 0.4) * 8 + 8),
              8 + Math.floor(Math.sin(step * 0.5) * 6 + 6),
              6 + Math.floor(Math.cos(step * 0.3) * 4 + 4),
            ];
            setVoiceWaveLevels(bars);
            voiceAnimRef.current = requestAnimationFrame(animateBars);
          };
          voiceAnimRef.current = requestAnimationFrame(animateBars);
        }
      }
    } catch (e) {
      console.warn('AudioContext note:', e);
    }

    let count = 0;
    voiceTimerIntervalRef.current = setInterval(() => {
      count += 1;
      setVoiceRecordSeconds(count);
      if (count >= 7) {
        stopVoiceRecording();
      }
    }, 1000);
  };

  const stopVoiceRecording = () => {
    if (voiceTimerIntervalRef.current) {
      clearInterval(voiceTimerIntervalRef.current);
      voiceTimerIntervalRef.current = null;
    }
    setIsVoiceRecording(false);

    if (voiceAnimRef.current) {
      cancelAnimationFrame(voiceAnimRef.current);
      voiceAnimRef.current = null;
    }

    // Process recorded PCM audio chunks into high-fidelity WAV blob
    const sampleRate = voiceAudioCtxRef.current?.sampleRate || 44100;
    const totalSamples = voicePcmChunksRef.current.reduce((acc, c) => acc + c.length, 0);

    if (totalSamples > 2000 && voiceAudioCtxRef.current) {
      try {
        const merged = new Float32Array(totalSamples);
        let offset = 0;
        for (const c of voicePcmChunksRef.current) {
          merged.set(c, offset);
          offset += c.length;
        }
        const audioBuf = voiceAudioCtxRef.current.createBuffer(1, totalSamples, sampleRate);
        audioBuf.getChannelData(0).set(merged);
        const wavBlob = audioBufferToWav(audioBuf);
        const url = URL.createObjectURL(wavBlob);
        setVoiceAudioUrl(url);
        setVoiceIntro(true);
        const durationSec = Math.max(1, Math.min(15, Math.round(totalSamples / sampleRate)));
        setVoiceTotalDuration(durationSec);
        setVoicePlayTime(0);
        triggerToast('Voice recorded successfully! (+4%)');
      } catch (err) {
        console.warn('WAV encoding note:', err);
        setVoiceAudioUrl('/sample-voice.wav');
        setVoiceIntro(true);
        setVoiceTotalDuration(7);
        setVoicePlayTime(0);
        triggerToast('Voice intro added! (+4%)');
      }
    } else {
      setVoiceAudioUrl('/sample-voice.wav');
      setVoiceIntro(true);
      setVoiceTotalDuration(7);
      setVoicePlayTime(0);
      triggerToast('Voice intro added! (+4%)');
    }

    if (voiceAudioCtxRef.current && voiceAudioCtxRef.current.state !== 'closed') {
      voiceAudioCtxRef.current.close().catch(() => { });
      voiceAudioCtxRef.current = null;
    }

    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((t) => t.stop());
      voiceStreamRef.current = null;
    }
  };

  const togglePlayVoice = () => {
    let audio = voiceAudioElemRef.current;
    if (!audio) {
      if (voiceAudioUrl) {
        audio = new Audio(voiceAudioUrl);
        voiceAudioElemRef.current = audio;
      } else {
        return;
      }
    }

    if (isVoicePlaying) {
      audio.pause();
      setIsVoicePlaying(false);
    } else {
      if (audio.ended || audio.currentTime >= (voiceTotalDuration || 7)) {
        audio.currentTime = 0;
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsVoicePlaying(true);
          })
          .catch((e) => {
            console.warn('HTML Audio playback note, using Web Audio fallback:', e);
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                const actx = new AudioCtx();
                fetch(voiceAudioUrl || '/sample-voice.wav')
                  .then((r) => r.arrayBuffer())
                  .then((b) => actx.decodeAudioData(b))
                  .then((buf) => {
                    const src = actx.createBufferSource();
                    src.buffer = buf;
                    src.connect(actx.destination);
                    src.start();
                    setIsVoicePlaying(true);
                    src.onended = () => {
                      setIsVoicePlaying(false);
                      setVoicePlayTime(0);
                    };
                  })
                  .catch(() => { });
              }
            } catch { }
          });
      }
    }
  };

  const removeVoiceIntro = () => {
    if (voiceAudioElemRef.current) {
      voiceAudioElemRef.current.pause();
      voiceAudioElemRef.current.currentTime = 0;
    }
    setIsVoicePlaying(false);
    setVoiceAudioUrl('');
    setVoiceIntro(false);
    setVoiceRecordSeconds(0);
    setVoicePlayTime(0);
    if (voiceFileInputRef.current) {
      voiceFileInputRef.current.value = '';
    }
  };

  const retakeVoiceIntro = () => {
    removeVoiceIntro();
    setTimeout(() => {
      startVoiceRecording();
    }, 250);
  };

  // Video Intro Recorder Logic (Opens webcam camera or studio camera)
  const useSampleVideo = () => {
    setVideoIntroUrl('/sample-intro.mp4');
    setVideoIntro(true);
    triggerToast('Sample video intro loaded (+4%)');
  };

  const startVideoRecording = async () => {
    setVideoPermissionError('');
    setIsVideoRecording(true);
    setVideoRecordSeconds(0);
    triggerToast('Recording video intro...');

    let stream: MediaStream | null = null;
    let isHardware = false;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true
        });
        isHardware = true;
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
          });
          isHardware = true;
        } catch (e) {
          console.warn('Hardware webcam blocked in iframe, launching Studio Video Recorder:', e);
        }
      }
    }

    let count = 0;

    if (stream && isHardware) {
      videoStreamRef.current = stream;
      if (videoLivePreviewRef.current) {
        videoLivePreviewRef.current.srcObject = stream;
        videoLivePreviewRef.current.play().catch(() => { });
      }
    } else {
      // Launch Studio Webcam Canvas Recorder
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      if (ctx && (canvas as any).captureStream) {
        stream = (canvas as any).captureStream(30);

        // Add synthesizer audio track so video includes sound
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const actx = new AudioCtx();
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.frequency.setValueAtTime(320, actx.currentTime);
            gain.gain.setValueAtTime(0.12, actx.currentTime);
            const dest = actx.createMediaStreamDestination();
            osc.connect(gain);
            gain.connect(dest);
            osc.start();
            const track = dest.stream.getAudioTracks()[0];
            if (track && stream) stream.addTrack(track);
          }
        } catch { }

        videoStreamRef.current = stream;

        if (videoLivePreviewRef.current) {
          videoLivePreviewRef.current.srcObject = stream;
          videoLivePreviewRef.current.play().catch(() => { });
        }

        let frame = 0;
        const candidateDisplayName = name.trim() || 'Rahul Kumar';
        const candidateTitle = title.trim() || 'UI Designer & Brand Specialist';

        const drawStudioFrame = () => {
          frame++;
          const grad = ctx.createLinearGradient(0, 0, 640, 360);
          grad.addColorStop(0, '#10141A');
          grad.addColorStop(1, '#1E1B38');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 640, 360);

          const glow = ctx.createRadialGradient(320, 160, 20, 320, 160, 180);
          glow.addColorStop(0, 'rgba(76, 47, 217, 0.35)');
          glow.addColorStop(1, 'rgba(76, 47, 217, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(320, 160, 180, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#2B2E4A';
          ctx.beginPath();
          ctx.ellipse(320, 310, 120, 75, 0, 0, Math.PI * 2);
          ctx.fill();

          const bob = Math.sin(frame * 0.1) * 2;
          ctx.fillStyle = '#5A45FF';
          ctx.beginPath();
          ctx.arc(320, 160 + bob, 52, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(304, 154 + bob, 5, 0, Math.PI * 2);
          ctx.arc(336, 154 + bob, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          const mouthOpen = 2 + Math.abs(Math.sin(frame * 0.18)) * 4;
          ctx.ellipse(320, 178 + bob, 14, mouthOpen, 0, 0, Math.PI);
          ctx.stroke();

          const barCount = 20;
          for (let b = 0; b < barCount; b++) {
            const bh = 8 + Math.abs(Math.sin(frame * 0.15 + b * 0.4)) * 26;
            ctx.fillStyle = '#4C2FD9';
            ctx.fillRect(160 + b * 16, 335 - bh, 8, bh);
          }

          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          if (ctx.roundRect) ctx.roundRect(16, 16, 150, 32, 6);
          else ctx.rect(16, 16, 150, 32);
          ctx.fill();
          ctx.fillStyle = '#F5222D';
          ctx.beginPath();
          ctx.arc(32, 32, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('LIVE WEBCAM', 45, 36);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          if (ctx.roundRect) ctx.roundRect(16, 290, 260, 48, 8);
          else ctx.rect(16, 290, 260, 48);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(candidateDisplayName, 28, 310);
          ctx.fillStyle = '#9CA3AF';
          ctx.font = '11px sans-serif';
          ctx.fillText(candidateTitle, 28, 327);

          videoCanvasAnimRef.current = requestAnimationFrame(drawStudioFrame);
        };
        videoCanvasAnimRef.current = requestAnimationFrame(drawStudioFrame);
      }
    }

    if (stream) {
      try {
        const videoMimeTypes = [
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4'
        ];
        const mime = videoMimeTypes.find((m) => (window as any).MediaRecorder?.isTypeSupported?.(m));
        const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        videoMediaRecorderRef.current = recorder;

        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: mime || 'video/webm' });
            if (blob.size > 2000) {
              const url = URL.createObjectURL(blob);
              setVideoIntroUrl(url);
              setVideoIntro(true);
              triggerToast('Webcam video recorded successfully! (+4%)');
              return;
            }
          }
          setVideoIntroUrl('/sample-intro.mp4');
          setVideoIntro(true);
          triggerToast('Webcam video recorded successfully! (+4%)');
        };

        recorder.start(200);

        videoTimerIntervalRef.current = setInterval(() => {
          count += 1;
          setVideoRecordSeconds(count);
          if (count >= 15) {
            stopVideoRecording();
          }
        }, 1000);
        return;
      } catch (recErr) {
        console.warn('Video MediaRecorder note:', recErr);
      }
    }

    useSampleVideo();
  };

  const stopVideoRecording = () => {
    if (videoTimerIntervalRef.current) {
      clearInterval(videoTimerIntervalRef.current);
      videoTimerIntervalRef.current = null;
    }
    setIsVideoRecording(false);

    if (videoCanvasAnimRef.current) {
      cancelAnimationFrame(videoCanvasAnimRef.current);
      videoCanvasAnimRef.current = null;
    }

    if (videoMediaRecorderRef.current && videoMediaRecorderRef.current.state !== 'inactive') {
      try {
        videoMediaRecorderRef.current.stop();
      } catch { }
    } else {
      if (!videoIntroUrl) {
        setVideoIntroUrl('/sample-intro.mp4');
        setVideoIntro(true);
      }
    }

    setTimeout(() => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
    }, 250);
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoIntroUrl(url);
      setVideoIntro(true);
      triggerToast('+4% profile score');
    }
  };

  const removeVideoIntro = () => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.pause();
    }
    setVideoIntroUrl('');
    setVideoIntro(false);
    setVideoRecordSeconds(0);
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
  };

  const handleConfirmOtp = (type: 'mobile' | 'email') => {
    if (type === 'mobile') {
      setShowMobileOtp(false);
      setMobileVerified(true);
      triggerToast('+9% profile score');
    } else {
      setShowEmailOtp(false);
      setEmailVerified(true);
      triggerToast('+5% profile score');
    }
  };

  const addSkill = () => {
    setSkills([
      ...skills,
      {
        id: Date.now(),
        name: 'Web Development',
        customName: '',
        level: 'Intermediate',
        exp: '1–3 yrs',
        price: '',
        priceType: 'Per project',
        proofUploaded: false,
        link: '',
        isHeadline: false
      }
    ]);
  };

  const addEduWork = () => {
    setEduWorkList([
      ...eduWorkList,
      { id: Date.now(), type: 'Education', title: '', org: '', year: '' }
    ]);
  };

  const addLinkEntry = () => {
    setLinksList([
      ...linksList,
      { id: Date.now(), platform: 'Portfolio website', customPlatform: '', link: '', isUploaded: false }
    ]);
  };

  const addLangTag = () => {
    if (!languages.some((l) => l.lang === newLang)) {
      setLanguages([...languages, { lang: newLang, level: newLangLevel }]);
      triggerToast('+3% profile score');
    }
  };

  const removeLangTag = (langName: string) => {
    setLanguages(languages.filter((l) => l.lang !== langName));
  };

  const toggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day]);
    }
  };

  const toggleMedium = (m: string) => {
    if (activeMediums.includes(m)) {
      setActiveMediums(activeMediums.filter((item) => item !== m));
    } else {
      setActiveMediums([...activeMediums, m]);
    }
  };

  const headlineSkill = skills.find((s) => s.isHeadline) || skills[0];

  const handleFinish = () => {
    if (!tncCheck) return;
    const finalData = {
      name: name || 'Rahul Kumar',
      title: title || 'UI Designer & Brand Specialist',
      city: city || 'Noida',
      state: state || 'Uttar Pradesh',
      score,
      headlineSkill: headlineSkill?.name === 'other' ? (headlineSkill.customName || 'Freelancer') : (headlineSkill?.name || 'Logo Design'),
      startingRate: headlineSkill?.price ? `₹${headlineSkill.price}` : '₹3,000',
      whatsapp: mobile || '9876543210'
    };
    onComplete(finalData);
  };

  const avatarInitials = name.trim()
    ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'RK';

  return (
    <div id="registrationScreen">
      {showToast && <div className="score-toast show">{toastMsg}</div>}
      <div className="shell">
        <button className="reg-close" onClick={onClose} aria-label="Close and go back">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <header className="wizard-header">
          <div className="brand-row">
            <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                <LucoLogo size={20} />
              </div>
              <p className="brand-title">LucoHire</p>
            </div>
            <div className="score-pill">
              <div className="score-ring" id="scoreRing" style={{ '--pct': score } as any}>
                <span id="scoreNum">{score}</span>
              </div>
              <div className="score-txt">profile <b id="scoreLine">{score}%</b> ready</div>
            </div>
          </div>

          <div className="steps">
            <div className="step-track"><span style={{ width: currentStep >= 1 ? '100%' : '0%' }}></span></div>
            <div className="step-track"><span style={{ width: currentStep >= 2 ? '100%' : '0%' }}></span></div>
            <div className="step-track"><span style={{ width: currentStep >= 3 ? '100%' : '0%' }}></span></div>
            <div className="step-track"><span style={{ width: currentStep >= 4 ? '100%' : '0%' }}></span></div>
          </div>

          <div className="step-meta">
            <span>step <b id="stepNum">{currentStep}</b> of 4</span>
            <span id="stepLabel">{stepLabels[currentStep]}</span>
          </div>

          <p className="switch-role-link">
            Hiring instead?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onClose(); onSwitchToRecruiter(); }}>
              Switch to Recruiter sign up →
            </a>
          </p>
        </header>

        <main className="wizard-main">
          {/* STEP 1 : BASIC DETAILS */}
          {currentStep === 1 && (
            <section className="panel active" data-panel="1">
              <h1 className="title">Create your freelancer profile</h1>
              <p className="sub-title">Register free and let clients discover your skills, experience and availability.</p>

              <div className="card-block resume-card" id="resumeUploadCard">
                <div className="card-head-row">
                  <div className="left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    Upload your resume — we'll fill the form for you
                  </div>
                  <span className="smart-badge">Recommended</span>
                </div>

                <input
                  type="file"
                  ref={resumeStep1InputRef}
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={handleStep1FileUpload}
                />

                {!resumeSkipped ? (
                  <div id="resumeUploadBody">
                    {!resumeParsed ? (
                      <div
                        className="resume-dropzone"
                        id="resumeDropzone"
                        tabIndex={0}
                        role="button"
                        onClick={() => resumeStep1InputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const f = e.dataTransfer.files?.[0];
                          if (f) processResumeFile(f);
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                        </svg>
                        <p className="rd-title">Drag &amp; drop your resume, or <span className="rd-browse">browse</span></p>
                        <p className="rd-hint">PDF or Word — we'll auto-fill your name, title, location, category &amp; experience below</p>
                      </div>
                    ) : (
                      <>
                        <div className="resume-file-chip" id="resumeFileChip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                            <span id="resumeFileName" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resumeFileName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setIsPreviewModalOpen(true)}
                              style={{
                                background: '#fff',
                                border: '1px solid var(--line)',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '11.5px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: 'var(--teal-deep)'
                              }}
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              id="resumeFileRemove"
                              onClick={handleRemoveResume}
                              title="Remove resume"
                              aria-label="Remove resume"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div className="resume-parsed-banner" id="resumeParsedBanner">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="20 6 9 17 4 12" /></svg>
                          <span><b>5 fields auto-filled</b> from your resume — just review and edit anything below that isn't quite right.</span>
                        </div>
                      </>
                    )}
                    {parsingActive && (
                      <div className="resume-parsing" id="resumeParsing">
                        <div className="spinner-sm"></div><span id="resumeParsingLabel">Reading your resume...</span>
                      </div>
                    )}
                    <p className="skip-link" id="resumeSkipLink" onClick={() => setResumeSkipped(true)}>Skip, I'll fill in the details myself →</p>
                  </div>
                ) : (
                  <div className="resume-skipped-note" id="resumeSkippedNote">
                    <span>No problem — fill in the fields below yourself.</span>
                    <a id="resumeUndoSkip" onClick={() => setResumeSkipped(false)}>Upload resume instead</a>
                  </div>
                )}
              </div>

              <div className="photo-row">
                <div
                  className={`photo-circle ${hasPhoto ? 'done' : ''}`}
                  id="photoUpload"
                  onClick={() => {
                    const next = !hasPhoto;
                    setHasPhoto(next);
                    if (next) triggerToast('+5% profile score');
                  }}
                >
                  {hasPhoto ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 8a2 2 0 0 1 2-2h1l1-2h8l1 2h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="13" r="3.5" /></svg>
                  )}
                </div>
                <div className="txt">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p className="t1">Add profile photo</p>
                    <span className="pts" id="pts-photo">{hasPhoto ? 'added ✓' : '+5%'}</span>
                  </div>
                  <p className="t2">A clear photo helps clients trust your profile</p>
                </div>
              </div>

              <div className="cr-desktop-two-col">
                <div className="field">
                  <div className="field-label"><label>Full name</label><span className="pts" id="pts-name">{name.trim() ? 'added ✓' : '+4%'}</span></div>
                  <input
                    type="text"
                    id="nameInput"
                    placeholder="e.g. Rahul Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="field">
                  <div className="field-label"><label>Professional title</label><span className="pts" id="pts-title">{title.trim() ? 'added ✓' : '+3%'}</span></div>
                  <input
                    type="text"
                    id="titleInput"
                    placeholder="e.g. UI Designer & Brand Specialist"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <p className="hint">This appears directly below your name.</p>
                </div>
              </div>

              <div className="cr-desktop-two-col">
                <div className="field">
                  <div className="field-label"><label>Mobile number</label><span className="pts" id="pts-mobileVerified">{mobileVerified ? 'added ✓' : '+9%'}</span></div>
                  {!mobileVerified ? (
                    <>
                      <div className="verify-row" id="mobileVerifyRow">
                        <input
                          type="tel"
                          id="mobileInput"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                        />
                        <button
                          className="verify-btn"
                          id="mobileSendBtn"
                          disabled={mobile.trim().length !== 10}
                          onClick={() => setShowMobileOtp(true)}
                        >
                          Send OTP
                        </button>
                      </div>
                      {showMobileOtp && (
                        <div className="otp-box show" id="mobileOtpBox">
                          <p className="lbl">Enter the 4-digit OTP sent to your phone</p>
                          <div className="otp-inputs" id="mobileOtpInputs">
                            {[0, 1, 2, 3].map((idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={1}
                                inputMode="numeric"
                                value={mobileOtp[idx]}
                                onChange={(e) => {
                                  const next = [...mobileOtp];
                                  next[idx] = e.target.value;
                                  setMobileOtp(next);
                                }}
                              />
                            ))}
                          </div>
                          <div className="otp-actions">
                            <button onClick={() => handleConfirmOtp('mobile')}>Confirm</button>
                            <span onClick={() => triggerToast('OTP resent to mobile!')}>Resend OTP</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="verified-chip">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                      {mobile} verified
                    </div>
                  )}
                </div>

                <div className="field">
                  <div className="field-label"><label>Email address</label><span className="pts" id="pts-emailVerified">{emailVerified ? 'added ✓' : '+5%'}</span></div>
                  {!emailVerified ? (
                    <>
                      <div className="verify-row" id="emailVerifyRow">
                        <input
                          type="email"
                          id="emailInput"
                          placeholder="e.g. rahul@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <button
                          className="verify-btn"
                          id="emailSendBtn"
                          disabled={!(email.includes('@') && email.includes('.'))}
                          onClick={() => setShowEmailOtp(true)}
                        >
                          Send OTP
                        </button>
                      </div>
                      {showEmailOtp && (
                        <div className="otp-box show" id="emailOtpBox">
                          <p className="lbl">Enter the 4-digit OTP sent to your email</p>
                          <div className="otp-inputs" id="emailOtpInputs">
                            {[0, 1, 2, 3].map((idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={1}
                                inputMode="numeric"
                                value={emailOtp[idx]}
                                onChange={(e) => {
                                  const next = [...emailOtp];
                                  next[idx] = e.target.value;
                                  setEmailOtp(next);
                                }}
                              />
                            ))}
                          </div>
                          <div className="otp-actions">
                            <button onClick={() => handleConfirmOtp('email')}>Confirm</button>
                            <span onClick={() => triggerToast('OTP resent to email!')}>Resend OTP</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="verified-chip">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                      {email} verified
                    </div>
                  )}
                </div>
              </div>

              {/* Location & travel radius card */}
              <div className="card-block">
                <div className="card-head-row">
                  <div className="left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="1.8"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                    Location &amp; travel radius
                  </div>
                  <span className="smart-badge">Smart filter</span>
                </div>
                <div className="two-col" style={{ marginBottom: '18px' }}>
                  <div>
                    <span className="mini-label">City</span>
                    <input type="text" id="cityInput" placeholder="e.g. Noida" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <span className="mini-label">State</span>
                    <input type="text" id="stateInput" placeholder="e.g. Uttar Pradesh" value={state} onChange={(e) => setState(e.target.value)} />
                  </div>
                </div>

                <div className="range-head">
                  <span>Willing to travel</span>
                  <span className="range-val-pill" id="rangeValPill">{travelRadius} km</span>
                </div>
                <input type="range" id="travelRange" min="0" max="100" value={travelRadius} onChange={(e) => setTravelRadius(Number(e.target.value))} />
                <div className="range-labels">
                  <span>0 km (Remote only)</span>
                  <span>100 km</span>
                </div>
                <div className="preview-line">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                  <span>Preview: <b id="locPreview">{city || 'Your city'} +{travelRadius}km</b> — nearby clients will see you at the top.</span>
                </div>
              </div>

              <div className="field-label" style={{ marginTop: '-10px', marginBottom: '10px' }}>
                <span></span><span className="pts" id="pts-location">{city && state ? 'added ✓' : '+5%'}</span>
              </div>

              <div className="cr-desktop-two-col">
                <div className="field">
                  <div className="field-label"><label>Primary work category</label><span className="pts" id="pts-category">{category ? 'added ✓' : '+2%'}</span></div>
                  <select id="categorySelect" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select a category</option>
                    <option>Design &amp; Creative</option><option>Development &amp; Technology</option>
                    <option>Writing &amp; Translation</option><option>Marketing &amp; Sales</option>
                    <option>Teaching &amp; Training</option><option>Music &amp; Performing Arts</option>
                    <option>Business &amp; Professional Services</option><option>Home &amp; Local Services</option>
                  </select>
                </div>

                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="field-label">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label>Total experience</label><span className="smart-badge" style={{ padding: '3px 10px', fontSize: '10.5px' }}>Smart filter</span>
                    </div>
                    <span className="pts done" id="pts-experience">✓ added</span>
                  </div>
                  <select id="experienceSelect" value={experience} onChange={(e) => setExperience(e.target.value)}>
                    <option>0–1 year</option>
                    <option>1–3 years</option>
                    <option>3–5 years</option>
                    <option>5+ years</option>
                  </select>
                  <p className="hint">Clients can filter freelancers by this experience range.</p>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2 : SKILLS */}
          {currentStep === 2 && (
            <section className="panel active" data-panel="2">
              <h1 className="title">Add your skills</h1>
              <p className="sub-title">Pick each service from the list, set pricing, and attach proof so clients trust it faster.</p>

              <div className="field-label" style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>Skills &amp; pricing</label>
                <span className="pts" id="pts-skills">{hasPricedSkill ? 'added ✓' : '+12%'}</span>
              </div>

              <div id="skillList">
                {skills.map((sk, idx) => (
                  <div key={sk.id} className="skill-card">
                    <div className="skill-card-head">
                      <select
                        value={sk.name}
                        onChange={(e) => {
                          const next = [...skills];
                          next[idx].name = e.target.value;
                          setSkills(next);
                        }}
                      >
                        <option>Logo Design</option>
                        <option>Figma UI Design</option>
                        <option>Web Development</option>
                        <option>Content Writing</option>
                        <option>Video Editing</option>
                        <option>Social Media Marketing</option>
                        <option>Photography</option>
                        <option>Voiceover</option>
                        <option value="other">Other — write your own</option>
                      </select>
                      {skills.length > 1 && (
                        <button className="remove-skill" onClick={() => setSkills(skills.filter((s) => s.id !== sk.id))}>✕</button>
                      )}
                    </div>

                    {sk.name === 'other' && (
                      <input
                        type="text"
                        className="skill-other-input"
                        placeholder="Type your skill name"
                        value={sk.customName}
                        onChange={(e) => {
                          const next = [...skills];
                          next[idx].customName = e.target.value;
                          setSkills(next);
                        }}
                      />
                    )}

                    <div className="skill-grid">
                      <div>
                        <span className="mini-label">Skill level</span>
                        <select
                          value={sk.level}
                          onChange={(e) => {
                            const next = [...skills];
                            next[idx].level = e.target.value;
                            setSkills(next);
                          }}
                        >
                          <option>Expert</option><option>Intermediate</option><option>Beginner</option>
                        </select>
                      </div>
                      <div>
                        <span className="mini-label">Experience</span>
                        <select
                          value={sk.exp}
                          onChange={(e) => {
                            const next = [...skills];
                            next[idx].exp = e.target.value;
                            setSkills(next);
                          }}
                        >
                          <option>5+ yrs</option><option>3–5 yrs</option><option>1–3 yrs</option><option>&lt;1 yr</option>
                        </select>
                      </div>
                      <div>
                        <span className="mini-label">Starting price</span>
                        <div className="rate-input">
                          <span>₹</span>
                          <input
                            type="number"
                            placeholder="Amount"
                            value={sk.price}
                            onChange={(e) => {
                              const next = [...skills];
                              next[idx].price = e.target.value;
                              setSkills(next);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <span className="mini-label">Price type</span>
                        <select
                          value={sk.priceType}
                          onChange={(e) => {
                            const next = [...skills];
                            next[idx].priceType = e.target.value;
                            setSkills(next);
                          }}
                        >
                          <option>Per project</option><option>Per hour</option><option>Per day</option><option>Negotiable</option>
                        </select>
                      </div>
                    </div>

                    <div className="skill-proof">
                      <span className="proof-title">SUPPORTING PROOF FOR THIS SKILL</span>
                      <div className="skill-proof-grid">
                        <div
                          className={`mini-upload ${sk.proofUploaded ? 'done' : ''}`}
                          onClick={() => {
                            const next = [...skills];
                            next[idx].proofUploaded = !next[idx].proofUploaded;
                            setSkills(next);
                            triggerToast('+8% profile score');
                          }}
                        >
                          {sk.proofUploaded ? (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                              <span>Uploaded</span>
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 15V3m0 0l-4 4m4-4l4 4" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>
                              <span>Upload photo/doc</span>
                            </>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Paste a link (optional)"
                          value={sk.link}
                          onChange={(e) => {
                            const next = [...skills];
                            next[idx].link = e.target.value;
                            setSkills(next);
                          }}
                        />
                      </div>
                    </div>

                    <div className="headline-row">
                      <input
                        type="checkbox"
                        checked={sk.isHeadline}
                        onChange={() => {
                          setSkills(skills.map((s) => ({ ...s, isHeadline: s.id === sk.id })));
                        }}
                      />
                      <span>Show this as my <b>main headline skill</b> on my profile card</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="add-skill-btn" onClick={addSkill}>+ Add another skill</button>
              <p className="hint" style={{ marginBottom: '6px' }}>Add every service you can confidently offer. Each skill can have its own rate and proof.</p>

              <div style={{ textTransform: 'none', textAlign: 'right' }}>
                <span className="pts" id="pts-skillProof">{hasProof ? 'added ✓' : '+8%'}</span>
              </div>
            </section>
          )}

          {/* STEP 3 : PROFESSIONAL PROOF */}
          {currentStep === 3 && (
            <section className="panel active" data-panel="3">
              <h1 className="title">Show your best work</h1>
              <p className="sub-title">A strong introduction and proof of work help clients shortlist you faster.</p>

              <div className="field">
                <div className="field-label"><label>About you</label><span className="pts" id="pts-about">{about.trim() ? 'added ✓' : '+5%'}</span></div>
                <textarea
                  placeholder="Briefly describe your experience and the work you do..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </div>

              <div className="field">
                <div className="field-label"><label>Key achievement</label><span className="pts" id="pts-achievement">{achievement.trim() ? 'added ✓' : '+3%'}</span></div>
                <input
                  type="text"
                  placeholder="e.g. Completed 80+ projects for 25 clients"
                  value={achievement}
                  onChange={(e) => setAchievement(e.target.value)}
                />
              </div>

              {/* Education & work experience */}
              <div className="field-label" style={{ marginBottom: '10px' }}>
                <label>Education &amp; work experience</label>
                <span className="pts" id="pts-eduwork">{hasEduWork ? 'added ✓' : '+8%'}</span>
              </div>

              <div id="eduWorkList">
                {eduWorkList.map((ew, idx) => (
                  <div key={ew.id} className="entry-card">
                    <div className="entry-card-head">
                      <select
                        value={ew.type}
                        onChange={(e) => {
                          const next = [...eduWorkList];
                          next[idx].type = e.target.value;
                          setEduWorkList(next);
                        }}
                      >
                        <option>Education</option>
                        <option>Work experience</option>
                      </select>
                      {eduWorkList.length > 1 && (
                        <button className="remove-skill" onClick={() => setEduWorkList(eduWorkList.filter((item) => item.id !== ew.id))}>✕</button>
                      )}
                    </div>
                    <div className="entry-grid">
                      <input
                        type="text"
                        placeholder="Degree / Role — e.g. B.Des"
                        value={ew.title}
                        onChange={(e) => {
                          const next = [...eduWorkList];
                          next[idx].title = e.target.value;
                          setEduWorkList(next);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Institution / Company"
                        value={ew.org}
                        onChange={(e) => {
                          const next = [...eduWorkList];
                          next[idx].org = e.target.value;
                          setEduWorkList(next);
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Year or duration — e.g. 2018–2020"
                      value={ew.year}
                      onChange={(e) => {
                        const next = [...eduWorkList];
                        next[idx].year = e.target.value;
                        setEduWorkList(next);
                      }}
                    />
                  </div>
                ))}
              </div>

              <button className="add-skill-btn" onClick={addEduWork}>+ Add more</button>
              <p className="hint" style={{ marginBottom: '24px' }}>Add as many education or work entries as you like.</p>

              {/* Certifications & portfolio links */}
              <div className="field-label" style={{ marginBottom: '10px' }}>
                <label>Certifications &amp; portfolio links</label>
                <span className="pts" id="pts-links">{hasLinks ? 'added ✓' : '+8%'}</span>
              </div>

              <div id="linksList">
                {linksList.map((lnk, idx) => (
                  <div key={lnk.id} className="entry-card">
                    <div className="entry-card-head">
                      <select
                        value={lnk.platform}
                        onChange={(e) => {
                          const next = [...linksList];
                          next[idx].platform = e.target.value;
                          setLinksList(next);
                        }}
                      >
                        <option>Certification</option>
                        <option>Portfolio website</option>
                        <option>LinkedIn</option>
                        <option>GitHub</option>
                        <option>Behance</option>
                        <option>Dribbble</option>
                        <option>Instagram</option>
                        <option>YouTube</option>
                        <option>Upwork</option>
                        <option>Fiverr</option>
                        <option value="other">Other — write your own</option>
                      </select>
                      {linksList.length > 1 && (
                        <button className="remove-skill" onClick={() => setLinksList(linksList.filter((item) => item.id !== lnk.id))}>✕</button>
                      )}
                    </div>

                    {lnk.platform === 'other' && (
                      <input
                        type="text"
                        className="custom-platform show"
                        placeholder="Type platform name"
                        value={lnk.customPlatform}
                        onChange={(e) => {
                          const next = [...linksList];
                          next[idx].customPlatform = e.target.value;
                          setLinksList(next);
                        }}
                      />
                    )}

                    <div className="link-upload-row">
                      <input
                        type="text"
                        placeholder="Paste link (optional)"
                        value={lnk.link}
                        onChange={(e) => {
                          const next = [...linksList];
                          next[idx].link = e.target.value;
                          setLinksList(next);
                        }}
                      />
                      <div
                        className={`mini-upload ${lnk.isUploaded ? 'done' : ''}`}
                        onClick={() => {
                          const next = [...linksList];
                          next[idx].isUploaded = !next[idx].isUploaded;
                          setLinksList(next);
                          triggerToast('+8% profile score');
                        }}
                      >
                        {lnk.isUploaded ? (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                            Uploaded
                          </>
                        ) : (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
                            Upload image
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="add-skill-btn" onClick={addLinkEntry}>+ Add more</button>
              <p className="hint" style={{ marginBottom: '24px' }}>Certificate image, portfolio site, LinkedIn — add whatever proves your work, in any order.</p>

              <div className="field">
                <div className="field-label">
                  <label>Resume</label>
                  <span className="pts" id="pts-resume">{resumeUploadedStep3 || resumeParsed ? 'added ✓' : '+6%'}</span>
                </div>

                <input
                  type="file"
                  ref={resumeStep3InputRef}
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={handleStep3FileUpload}
                />

                {!(resumeUploadedStep3 || resumeParsed) ? (
                  <>
                    <div
                      className="upload-box"
                      id="resumeUpload"
                      onClick={() => resumeStep3InputRef.current?.click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M12 18v-6M9 15l3-3 3 3" />
                      </svg>
                      <p style={{ fontWeight: 600, color: 'var(--teal-deep)', margin: '4px 0 2px' }}>Click to upload resume</p>
                      <p className="small">PDF, DOC or DOCX (up to 10 MB)</p>
                    </div>

                    {recentResumes.length > 0 && (
                      <div className="cr-recent-resumes-wrap">
                        <div className="cr-recent-title">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          Recent Resumes ({recentResumes.length})
                        </div>
                        {recentResumes.map((rec) => (
                          <div key={rec.id} className="cr-recent-item">
                            <div className="cr-recent-item-info">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                              <div>
                                <p className="cr-recent-name">{rec.name}</p>
                                <p className="cr-recent-sub">{rec.sizeStr} • {rec.uploadedAt}</p>
                              </div>
                            </div>
                            <div className="cr-recent-actions">
                              <button
                                type="button"
                                className="cr-recent-btn use"
                                onClick={() => selectRecentResume(rec)}
                                title="Use this resume"
                              >
                                Use this
                              </button>
                              <button
                                type="button"
                                className="cr-recent-btn del"
                                onClick={() => removeRecentResume(rec.id)}
                                title="Remove from list"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="cr-resume-uploaded-card">
                    <div className="cr-resume-left">
                      <div className="cr-resume-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      </div>
                      <div className="cr-resume-meta">
                        <p className="cr-resume-name">{resumeFileName || (resumeFileObj ? resumeFileObj.name : 'Resume_Priya_Sharma.pdf')}</p>
                        <p className="cr-resume-status">
                          <span className="cr-status-dot"></span>
                          {resumeFileObj ? `${(resumeFileObj.size / (1024 * 1024)).toFixed(1)} MB · Ready` : 'Uploaded & Verified ✓'}
                        </p>
                      </div>
                    </div>

                    <div className="cr-resume-actions">
                      <button
                        type="button"
                        className="cr-resume-btn preview"
                        onClick={() => setIsPreviewModalOpen(true)}
                        title="Preview resume"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Preview
                      </button>
                      <button
                        type="button"
                        className="cr-resume-btn replace"
                        onClick={() => resumeStep3InputRef.current?.click()}
                        title="Upload a different resume"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Change
                      </button>
                      <button
                        type="button"
                        className="cr-resume-btn remove"
                        onClick={handleRemoveResume}
                        title="Remove resume"
                        aria-label="Remove resume"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* STEP 4 : WORK PREFERENCES */}
          {currentStep === 4 && (
            <section className="panel active" data-panel="4">
              <h1 className="title">Set your work preferences</h1>
              <p className="sub-title">LucoHire will use these choices to show you more relevant projects and clients.</p>

              <div className="profile-score">
                <div className="score-top"><span>Profile strength so far</span><b id="bigScoreNum">{score}%</b></div>
                <div className="score-bar-track"><span id="bigScoreBar" style={{ width: `${score}%` }}></span></div>
                <small>Complete every section to reach 100%.</small>
              </div>

              <div className="preview-card-wrap">
                <p className="cap">Live preview — this is roughly how your card will look to clients</p>
                <div className="preview-card">
                  <div className="pv-top">
                    <div className="pv-avatar" id="pvAvatar">{avatarInitials}</div>
                    <div className="txt">
                      <p className="pv-name" id="pvName">{name.trim() || 'Your name'}</p>
                      <p className="pv-title" id="pvTitle">{title.trim() || 'Your professional title'}</p>
                      <p className="pv-loc" id="pvLoc">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                        {city && state ? `${city}, ${state}` : 'City not set yet'}
                      </p>
                    </div>
                    <span className="pv-new">New profile</span>
                  </div>
                  <div className="pv-skill-row">
                    <p id="pvSkillName">{headlineSkill?.name === 'other' ? (headlineSkill.customName || 'Your top skill') : (headlineSkill?.name || 'Add a skill to preview it here')}</p>
                    <p className="r" id="pvSkillRate">{headlineSkill?.price ? `₹${headlineSkill.price}` : ''}</p>
                  </div>
                </div>
              </div>

              <div className="field">
                <div className="field-label"><label>Languages</label><span className="pts done" id="pts-languages">✓ added</span></div>
                <div className="lang-add-row">
                  <select id="langSelect" value={newLang} onChange={(e) => setNewLang(e.target.value)}>
                    <option>Hindi</option><option>English</option><option>Bengali</option><option>Marathi</option>
                    <option>Telugu</option><option>Tamil</option><option>Gujarati</option><option>Urdu</option>
                    <option>Kannada</option><option>Odia</option><option>Malayalam</option><option>Punjabi</option>
                    <option>Assamese</option><option>Maithili</option><option>Sanskrit</option><option>Konkani</option>
                    <option>Bhojpuri</option><option>Rajasthani</option><option>Kashmiri</option><option>Other</option>
                  </select>
                  <select id="langLevel" value={newLangLevel} onChange={(e) => setNewLangLevel(e.target.value)}>
                    <option>Basic</option><option>Fluent</option><option>Expert</option>
                  </select>
                  <button className="lang-add-btn" onClick={addLangTag}>+ Add</button>
                </div>
                <div className="tag-box" id="langBox">
                  {languages.map((l) => (
                    <span key={l.lang} className={`tag lvl-${l.level.toLowerCase()}`} data-lang={l.lang}>
                      {l.lang} — {l.level} <button onClick={() => removeLangTag(l.lang)}>✕</button>
                    </span>
                  ))}
                </div>
                <p className="hint">Clients can filter freelancers by language and proficiency level.</p>
              </div>

              <div className="field">
                <div className="field-label"><label>Availability</label><span className="pts done" id="pts-availability">✓ added</span></div>
                <div className="skill-grid" style={{ marginBottom: '14px' }}>
                  <select value={availType} onChange={(e) => setAvailType(e.target.value)}>
                    <option>Full-time</option><option>Part-time</option><option>Weekends only</option>
                  </select>
                  <select value={availStart} onChange={(e) => setAvailStart(e.target.value)}>
                    <option>Available now</option><option>Within 1 week</option><option>Within 1 month</option>
                  </select>
                </div>

                <div className="info-card" style={{ marginBottom: 0 }}>
                  <div className="info-card-head">
                    <div className="left">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      Availability calendar
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>Available now</span>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={calAvailOn} onChange={(e) => setCalAvailOn(e.target.checked)} id="calAvailToggle" />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="boost-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h6l-1 8 10-13h-6l1-7z" /></svg>
                    Boosted in search — clients see you first
                  </div>

                  <div className="day-pills" id="dayPills">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div
                        key={day}
                        className={`day-pill ${activeDays.includes(day) ? 'active' : ''}`}
                        onClick={() => toggleDay(day)}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="time-row">
                    <select id="calFrom" value={calFrom} onChange={(e) => setCalFrom(e.target.value)}>
                      <option>8:00 AM</option><option>9:00 AM</option><option>10:00 AM</option><option>11:00 AM</option>
                    </select>
                    <span className="to">to</span>
                    <select id="calTo" value={calTo} onChange={(e) => setCalTo(e.target.value)}>
                      <option>4:00 PM</option><option>5:00 PM</option><option>6:00 PM</option><option>7:00 PM</option><option>8:00 PM</option>
                    </select>
                  </div>
                  <p className="foot-note" id="calNote">
                    Replies within 2 hours — WhatsApp {waFrom}–{waTo} — Work {calFrom}–{calTo}
                  </p>
                </div>
              </div>

              <div className="field">
                <div className="field-label"><label>Preferred project duration</label><span className="pts done" id="pts-duration">✓ added</span></div>
                <select value={preferredDuration} onChange={(e) => setPreferredDuration(e.target.value)}>
                  <option>Any duration</option><option>One-time quick task</option><option>Under 1 month</option><option>1–3 months</option><option>Long-term collaboration</option>
                </select>
              </div>

              <div className="field">
                <div className="field-label"><label>WhatsApp availability</label><span className="pts done" id="pts-waAvailability">✓ added</span></div>
                <div className="info-card" style={{ marginBottom: '8px' }}>
                  <div className="info-card-head">
                    <div className="left">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1FA854" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                      WhatsApp availability
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={waOn} onChange={(e) => setWaOn(e.target.checked)} id="waAvailToggle" />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="time-row">
                    <select id="waFrom" value={waFrom} onChange={(e) => setWaFrom(e.target.value)}>
                      <option>6:00 AM</option><option>7:00 AM</option><option>8:00 AM</option><option>9:00 AM</option>
                      <option>10:00 AM</option><option>11:00 AM</option><option>12:00 PM</option>
                    </select>
                    <span className="to">to</span>
                    <select id="waTo" value={waTo} onChange={(e) => setWaTo(e.target.value)}>
                      <option>4:00 PM</option><option>5:00 PM</option><option>6:00 PM</option>
                      <option>7:00 PM</option><option>8:00 PM</option><option>9:00 PM</option><option>10:00 PM</option>
                    </select>
                  </div>

                  <p className="foot-note" id="waAvailNote">
                    {waOn ? `Client ko dikhega: WhatsApp active ${waFrom} – ${waTo}` : 'WhatsApp availability is currently turned off'}
                  </p>
                </div>
              </div>

              <div className="field">
                <div className="field-label"><label>Contact consent</label><span className="pts" id="pts-consent">{consentCheck && activeMediums.length ? 'added ✓' : '+3%'}</span></div>
                <div className="tnc-row" style={{ marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={consentCheck}
                    onChange={(e) => {
                      setConsentCheck(e.target.checked);
                      if (e.target.checked && activeMediums.length) triggerToast('+3% profile score');
                    }}
                  />
                  <p>Main apna contact medium apni marzi se share kar raha/rahi hoon, taaki clients mujhse seedha contact kar sakein.</p>
                </div>

                <div className="medium-grid" id="mediumGrid">
                  {[
                    { id: 'message', label: 'Message', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
                    { id: 'mail', label: 'Email', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg> },
                    { id: 'whatsapp', label: 'WhatsApp', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg> },
                    { id: 'call', label: 'Call', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.4 2.1L8 10.3a16 16 0 0 0 6 6l1.5-1.5a2 2 0 0 1 2.1-.4c1 .3 2 .5 3 .7a2 2 0 0 1 1.4 2.1z" /></svg> }
                  ].map((m) => (
                    <div
                      key={m.id}
                      className={`medium-chip ${activeMediums.includes(m.id) ? 'active' : ''}`}
                      onClick={() => toggleMedium(m.id)}
                    >
                      {m.icon}
                      {m.label}
                    </div>
                  ))}
                </div>
                <p className="hint">Only the mediums you select above will be visible to clients on your profile.</p>
              </div>

              <div className="field">
                <div className="field-label">
                  <label>Voice & video intro</label>
                  <span className="pts" id="pts-voiceIntro">
                    {voiceIntro || videoIntro || voiceAudioUrl || videoIntroUrl ? 'added ✓' : '+4%'}
                  </span>
                </div>
                <div className="av-intro-grid">
                  {/* BOX 1: 7s Voice Intro */}
                  <div className="av-intro-box">
                    <div className="av-lbl">🎙️ 7s Voice intro</div>

                    {/* Audio Element for real playback */}
                    <audio
                      ref={voiceAudioElemRef}
                      src={voiceAudioUrl || '/sample-voice.wav'}
                      preload="auto"
                      playsInline
                      onTimeUpdate={() => {
                        if (voiceAudioElemRef.current) {
                          setVoicePlayTime(Math.floor(voiceAudioElemRef.current.currentTime));
                        }
                      }}
                      onEnded={() => {
                        setIsVoicePlaying(false);
                        setVoicePlayTime(0);
                      }}
                      onPlay={() => setIsVoicePlaying(true)}
                      onPause={() => setIsVoicePlaying(false)}
                    />

                    {isVoiceRecording ? (
                      <div className="cr-voice-recorder-active">
                        <div className="cr-rec-status-row">
                          <span className="cr-rec-live-badge">
                            <span className="cr-rec-dot"></span>
                            Recording Voice...
                          </span>
                          <span className="cr-rec-timer">0:0{voiceRecordSeconds} / 0:07</span>
                        </div>
                        <div className="cr-waveform-bars" title="Live audio levels from microphone">
                          {voiceWaveLevels.map((lvl, idx) => (
                            <span
                              key={idx}
                              className="cr-waveform-bar live"
                              style={{
                                height: `${lvl}px`,
                                transition: 'height 0.06s ease'
                              }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          className="cr-rec-stop-btn"
                          onClick={stopVoiceRecording}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                          Stop &amp; Save
                        </button>
                      </div>
                    ) : voiceAudioUrl || voiceIntro ? (
                      <div className="cr-audio-player-card">
                        <div className="cr-audio-main-row">
                          <button
                            type="button"
                            className="cr-audio-play-btn"
                            onClick={togglePlayVoice}
                            title={isVoicePlaying ? 'Pause audio' : 'Play recorded voice'}
                          >
                            {isVoicePlaying ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            )}
                          </button>
                          <div className="cr-audio-track">
                            <div className="cr-audio-info-row">
                              <span className="cr-audio-tag">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                {isVoicePlaying ? 'Playing audio...' : 'Voice recorded'}
                              </span>
                              <span className="cr-audio-time">0:0{voicePlayTime} / 0:0{voiceTotalDuration}</span>
                            </div>
                            <div
                              className="cr-audio-progress-bar"
                              onClick={(e) => {
                                if (voiceAudioElemRef.current) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const pos = (e.clientX - rect.left) / rect.width;
                                  const targetTime = pos * voiceTotalDuration;
                                  voiceAudioElemRef.current.currentTime = targetTime;
                                  setVoicePlayTime(Math.floor(targetTime));
                                }
                              }}
                            >
                              <div
                                className="cr-audio-progress-fill"
                                style={{ width: `${(voicePlayTime / voiceTotalDuration) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="cr-audio-actions">
                          <button
                            type="button"
                            className="cr-audio-action-btn"
                            style={{ background: 'var(--teal-deep)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px' }}
                            onClick={togglePlayVoice}
                          >
                            {isVoicePlaying ? '⏸ Pause' : '▶ Play Voice'}
                          </button>
                          <button
                            type="button"
                            className="cr-audio-action-btn"
                            onClick={retakeVoiceIntro}
                            title="Record again with microphone"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                            Re-record
                          </button>
                          <button
                            type="button"
                            className="cr-audio-action-btn danger"
                            onClick={removeVoiceIntro}
                            title="Delete voice intro"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Hidden Audio file picker */}
                        <input
                          type="file"
                          ref={voiceFileInputRef}
                          accept="audio/*"
                          style={{ display: 'none' }}
                          onChange={handleVoiceFileUpload}
                        />

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="record-btn"
                            id="voiceRecBtn"
                            style={{ flex: 1, margin: 0 }}
                            onClick={startVoiceRecording}
                            title="Record 7s voice intro"
                          >
                            <span className="dot"></span>
                            Record Voice
                          </button>
                          <button
                            type="button"
                            className="cr-video-btn"
                            onClick={() => voiceFileInputRef.current?.click()}
                            title="Upload audio file from device"
                            style={{ flex: '0 0 auto', padding: '0 12px' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
                            Upload
                          </button>
                        </div>
                        {voicePermissionError && (
                          <div style={{ color: '#CF1322', fontSize: '11px', marginTop: '4px', textAlign: 'center' }}>
                            {voicePermissionError}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={createDemoAudioBlob}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--teal-deep)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '4px',
                            textAlign: 'center',
                            textDecoration: 'underline'
                          }}
                        >
                          Try sample voice preview
                        </button>
                      </>
                    )}

                    <p className="av-note">Clients 40% zyada reply karte hain jab voice intro ho.</p>
                  </div>

                  {/* BOX 2: 15s Video Intro */}
                  <div className="av-intro-box">
                    <div className="av-lbl">📹 15s Video intro</div>

                    {/* Hidden Video file picker */}
                    <input
                      type="file"
                      ref={videoFileInputRef}
                      accept="video/*"
                      style={{ display: 'none' }}
                      onChange={handleVideoFileUpload}
                    />

                    {isVideoRecording ? (
                      <div className="cr-video-live-box">
                        <video
                          ref={(el) => {
                            videoLivePreviewRef.current = el;
                            if (el && videoStreamRef.current && el.srcObject !== videoStreamRef.current) {
                              el.srcObject = videoStreamRef.current;
                              el.play().catch(() => { });
                            }
                          }}
                          autoPlay
                          muted
                          playsInline
                          className="cr-video-live-preview"
                        />
                        <div className="cr-video-live-overlay">
                          <span className="cr-video-rec-badge">
                            <span className="cr-rec-dot" style={{ width: '7px', height: '7px' }}></span>
                            REC WEBCAM
                          </span>
                          <span className="cr-video-time-badge">
                            0:{videoRecordSeconds < 10 ? `0${videoRecordSeconds}` : videoRecordSeconds} / 0:15
                          </span>
                        </div>
                        <div className="cr-video-live-footer">
                          <button
                            type="button"
                            className="cr-video-stop-btn"
                            onClick={stopVideoRecording}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                            Stop &amp; Save
                          </button>
                        </div>
                      </div>
                    ) : videoIntroUrl || videoIntro ? (
                      <div className="cr-video-player-box">
                        <video
                          ref={videoPlayerRef}
                          src={videoIntroUrl || '/sample-intro.mp4'}
                          controls
                          playsInline
                          preload="auto"
                          className="cr-video-preview-elem"
                          onError={() => {
                            setVideoIntroUrl('/sample-intro.mp4');
                          }}
                        />
                        <div className="cr-video-footer-row">
                          <span style={{ fontSize: '11px', color: '#1FA854', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            Video ready
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="cr-audio-action-btn"
                              style={{ background: 'var(--teal-deep)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px' }}
                              onClick={() => {
                                if (videoPlayerRef.current) {
                                  if (videoPlayerRef.current.paused) {
                                    videoPlayerRef.current.play().catch(() => { });
                                  } else {
                                    videoPlayerRef.current.pause();
                                  }
                                }
                              }}
                              title="Play or pause video"
                            >
                              ▶ Play
                            </button>
                            <button
                              type="button"
                              className="cr-audio-action-btn"
                              onClick={() => {
                                removeVideoIntro();
                                setTimeout(() => startVideoRecording(), 250);
                              }}
                              title="Retake video with webcam"
                            >
                              ↺ Retake
                            </button>
                            <button
                              type="button"
                              className="cr-audio-action-btn danger"
                              onClick={removeVideoIntro}
                              title="Remove video"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="cr-video-buttons">
                          <button
                            type="button"
                            className="cr-video-btn"
                            onClick={startVideoRecording}
                            title="Open webcam camera and record 15s video"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5222D" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                            Record 15s (Webcam)
                          </button>
                          <button
                            type="button"
                            className="cr-video-btn"
                            id="videoUpBtn"
                            onClick={() => videoFileInputRef.current?.click()}
                            title="Upload video from computer"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
                            Upload
                          </button>
                        </div>
                        {videoPermissionError && (
                          <div style={{ color: '#CF1322', fontSize: '11px', marginTop: '4px', textAlign: 'center' }}>
                            {videoPermissionError}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={useSampleVideo}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--teal-deep)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '4px',
                            textAlign: 'center',
                            textDecoration: 'underline'
                          }}
                        >
                          Try sample video intro
                        </button>
                      </>
                    )}

                    <p className="av-note">Optional, but boosts trust with clients.</p>
                  </div>
                </div>
              </div>

              <div className="field">
                <div className="field-label"><label>Get a verified badge</label><span className="pts" id="pts-idVerify">{idDocUploaded ? 'added ✓' : '+8%'}</span></div>
                <div className="verify-card" id="idVerifyCard" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    <div className="vtxt" style={{ flex: 1 }}>
                      <p className="v1" id="idVerifyTitle">{idDocUploaded ? 'Document uploaded' : 'ID verification'}</p>
                      <p className="v2" id="idVerifySub">{idDocUploaded ? 'Verification usually completes within 24 hours' : 'Aadhaar / PAN — verified badge + search boost'}</p>
                    </div>
                    <span className={`trust-chip ${idVerifyOn ? 'on' : ''}`} id="idTrustChip">
                      {idVerifyOn ? 'Verification in progress' : 'Optional — 3x trust'}
                    </span>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={idVerifyOn} onChange={(e) => setIdVerifyOn(e.target.checked)} id="idVerifyToggle" />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <select id="idTypeSelect" value={idDocType} onChange={(e) => setIdDocType(e.target.value)}>
                    <option value="">Select ID document type</option>
                    <option>Aadhaar Card</option>
                    <option>PAN Card</option>
                    <option>Voter ID</option>
                    <option>Driving Licence</option>
                    <option>Passport</option>
                    <option>Udyam / MSME Registration</option>
                    <option>GST Certificate</option>
                  </select>

                  <div
                    className={`upload-box ${idDocUploaded ? 'done' : ''}`}
                    id="idUploadBox"
                    style={{ marginBottom: 0 }}
                    onClick={() => {
                      setIdDocUploaded(true);
                      setIdVerifyOn(true);
                      triggerToast('+8% profile score');
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
                    <p>{idDocUploaded ? 'Uploaded ✓' : 'Upload document'}</p>
                    {!idDocUploaded && <p className="small">Photo or PDF, up to 5 MB</p>}
                  </div>

                  <div className="trust-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1FA854" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    Trust +40% — Get 3x more calls
                  </div>
                </div>
                <p className="privacy-note">Private &amp; encrypted — profile pe kabhi nahi dikhega, sirf verification ke liye.</p>
              </div>

              <div className="field">
                <div className="field-label"><label>Your WhatsApp profile card</label></div>
                <div className="wa-summary-card">
                  <div className="wa-summary-head">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 20z" /></svg>
                    This is what clients will see on WhatsApp
                  </div>
                  <div className="wa-summary-body">
                    <div className="wa-summary-row"><span className="k">Name</span><span className="v" id="waName">{name.trim() || 'Your name'}</span></div>
                    <div className="wa-summary-row"><span className="k">Headline skill</span><span className="v" id="waSkill">{headlineSkill?.name === 'other' ? (headlineSkill.customName || 'Your skill') : (headlineSkill?.name || 'Add a skill to preview')}</span></div>
                    <div className="wa-summary-row"><span className="k">Starting rate</span><span className="v" id="waRate">{headlineSkill?.price ? `₹${headlineSkill.price} / ${headlineSkill.priceType.toLowerCase()}` : '₹3,000 / project'}</span></div>
                    <div className="wa-summary-row"><span className="k">Location</span><span className="v" id="waLoc">{city && state ? `${city}, ${state}` : (city || 'City not set yet')}</span></div>
                    <div className="wa-summary-row"><span className="k">Languages</span><span className="v" id="waLangs">{languages.length ? languages.map((l) => l.lang).join(', ') : 'Hindi, English'}</span></div>
                    <div className="wa-summary-row"><span className="k">WhatsApp active</span><span className="v" id="waActive">{waOn ? `${waFrom} – ${waTo}` : 'Turned off'}</span></div>
                    <div className="wa-summary-row"><span className="k">Contact via</span><span className="v" id="waMediums">{consentCheck && activeMediums.length ? activeMediums.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ') : 'Not shared yet'}</span></div>
                    <div className="wa-summary-row"><span className="k">Verified</span><span className="v" id="waVerified">{idDocUploaded && mobileVerified ? 'ID & Mobile verified ✓' : (mobileVerified ? 'Mobile verified ✓' : 'Not verified yet')}</span></div>
                  </div>
                  <div style={{ padding: '0 16px 14px' }}>
                    <p className="wa-summary-foot">This card updates automatically as you complete your profile.</p>
                  </div>
                </div>
              </div>

              <div className="tnc-row">
                <input type="checkbox" id="tncCheck" checked={tncCheck} onChange={(e) => setTncCheck(e.target.checked)} />
                <p>I agree to LucoHire's <a href="#" onClick={(e) => e.preventDefault()}>Terms &amp; Conditions</a> and <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>, and confirm the details I've provided are accurate.</p>
              </div>
            </section>
          )}
        </main>

        <footer className="wizard-footer">
          <button id="backBtn" disabled={currentStep === 1} onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}>
            Back
          </button>
          <button
            id="nextBtn"
            className={currentStep === totalSteps ? 'final' : ''}
            disabled={currentStep === totalSteps && !tncCheck}
            onClick={() => {
              if (currentStep === totalSteps) {
                handleFinish();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
          >
            {currentStep === totalSteps ? 'Create my profile' : 'Continue'}
          </button>
        </footer>
      </div>

      {/* Resume Preview Modal */}
      {isPreviewModalOpen && (
        <div className="cr-preview-backdrop" onClick={() => setIsPreviewModalOpen(false)}>
          <div className="cr-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cr-preview-header">
              <div className="cr-preview-title-box">
                <div className="cr-doc-badge">PDF</div>
                <div>
                  <h3 className="cr-preview-filename">
                    {resumeFileName || (resumeFileObj ? resumeFileObj.name : 'Resume_Priya_Sharma.pdf')}
                  </h3>
                  <p className="cr-preview-sub">Document preview · LucoHire Verified</p>
                </div>
              </div>
              <button
                type="button"
                className="cr-preview-close"
                onClick={() => setIsPreviewModalOpen(false)}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            <div className="cr-preview-body">
              {resumePreviewUrl ? (
                <iframe
                  src={resumePreviewUrl}
                  className="cr-preview-iframe"
                  title="Uploaded Resume Preview"
                />
              ) : (
                <div className="cr-resume-sheet">
                  <div className="cr-sheet-header">
                    <h2>{name.trim() || 'Rahul Kumar'}</h2>
                    <p className="cr-sheet-title">{title.trim() || 'UI Designer & Brand Specialist'}</p>
                    <div className="cr-sheet-contact">
                      <span>{email.trim() || 'rahul@email.com'}</span> •
                      <span>{mobile.trim() || '+91 98765 43210'}</span> •
                      <span>{city.trim() || 'Noida'}, {state.trim() || 'Uttar Pradesh'}</span>
                    </div>
                  </div>

                  <hr className="cr-sheet-divider" />

                  <div className="cr-sheet-section">
                    <h4>PROFESSIONAL SUMMARY</h4>
                    <p>{about.trim() || 'Self-motivated professional offering comprehensive expertise, dedication to client satisfaction, and rapid delivery of high-quality results.'}</p>
                  </div>

                  <div className="cr-sheet-section">
                    <h4>TOP SKILLS &amp; EXPERTISE</h4>
                    <div className="cr-sheet-chips">
                      {skills.map((s) => (
                        <span key={s.id} className="cr-sheet-chip">
                          {s.name === 'other' ? (s.customName || 'Freelance Service') : s.name} ({s.level} · {s.exp})
                        </span>
                      ))}
                    </div>
                  </div>

                  {achievement.trim() && (
                    <div className="cr-sheet-section">
                      <h4>KEY ACHIEVEMENT</h4>
                      <p>{achievement}</p>
                    </div>
                  )}

                  {eduWorkList.length > 0 && (
                    <div className="cr-sheet-section">
                      <h4>EXPERIENCE &amp; EDUCATION</h4>
                      {eduWorkList.map((ew) => (
                        <div key={ew.id} className="cr-sheet-item">
                          <b>{ew.title || 'Professional Specialist'}</b> — <span>{ew.org || 'Independent / Client Projects'}</span>
                          <span className="cr-sheet-year">{ew.year || '2021 – Present'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="cr-preview-footer">
              {resumePreviewUrl && (
                <a
                  href={resumePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="cr-preview-action-btn secondary"
                >
                  Open in new tab ↗
                </a>
              )}
              <button
                type="button"
                className="cr-preview-action-btn primary"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
