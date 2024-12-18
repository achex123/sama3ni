import { useState, useEffect } from 'react';

interface RecognizedSong {
  matches: any[];
  location: any;
  timestamp: number;
  timezone: string;
  track: {
    type: string;
    key: string;
    title: string;
    subtitle: string;
    images: {
      background: string;
      coverart: string;
      coverarthq: string;
    };
    url: string;
    artists: any[];
    albumadamid: string;
  };
}

export default function Home() {
  const [recognizedSong, setRecognizedSong] = useState<RecognizedSong | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(true);
  const [isCapturingAudio, setIsCapturingAudio] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const maxCaptureTime = 6000;

  useEffect(() => {
    console.log("Component rendered");
    checkMicrophone();
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkMicrophone = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicrophone(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      setHasMicrophone(false);
    }
  };

  const stopRecording = (mediaRecorder: MediaRecorder, stream: MediaStream) => {
    mediaRecorder.stop();
    stream.getTracks().forEach(track => track.stop());
  };

  const recognizeSong = async (captureStream: string) => {
    if (isRecording || isCapturingAudio) return;

    if (captureStream === 'microphone') {
      setIsRecording(true);
    } else {
      setIsCapturingAudio(true);
    }

    try {
      const stream = await (captureStream === 'microphone'
        ? navigator.mediaDevices.getUserMedia({ audio: true })
        : navigator.mediaDevices.getDisplayMedia({ audio: true })
      );
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('upload_file', audioBlob, 'audio.wav');

        try {
          const response = await fetch('https://shazam-api6.p.rapidapi.com/shazam/recognize/', {
            method: 'POST',
            headers: {
              'x-rapidapi-key': '683604ae50mshe7365e5c75c0593p18cc8ajsn2d7829eb5062',
              'x-rapidapi-host': 'shazam-api6.p.rapidapi.com',
            },
            body: formData
          });

          const data = await response.json();
          setRecognizedSong(data);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          stopRecording(mediaRecorder, stream);

        } catch (error) {
          console.error('Error recognizing song:', error);
        } finally {
          if (captureStream === 'microphone') {
            setIsRecording(false);
          } else {
            setIsCapturingAudio(false);
          }
        }
      });

      mediaRecorder.start();

      timeoutId = setTimeout(() => {
        stopRecording(mediaRecorder, stream);
      }, maxCaptureTime);

    } catch (error) {
      console.error(`Error accessing/capturing ${captureStream}:`, error);
      if (captureStream === 'microphone') {
        setIsRecording(false);
      } else {
        setIsCapturingAudio(false);
      }
    }
  };

  const captureAudioFromPC = async () => {
    await recognizeSong('pc');
  }

  const clearResults = () => {
    setRecognizedSong(null);
  };

  return (
    <div className="bg-gradient-to-b from-blue-600 to-blue-400 min-h-screen text-white flex flex-col items-center justify-center">
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-6xl font-extrabold text-white mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
            Sama3ni
          </span>
        </h1>
        <p className="text-xl mb-10 text-gray-200">
          Discover the music around you.
        </p>
        <div className="flex justify-center space-x-6 mb-12">
          <button
            onClick={() => recognizeSong('microphone')}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
            disabled={isRecording || !hasMicrophone}
          >
            {isRecording ? 'Recording...' : 'Microphone'}
          </button>
          {!isMobile && (
            <button
              onClick={() => recognizeSong('pc')}
              className="bg-white hover:bg-gray-200 text-gray-900 font-bold py-4 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
              disabled={isCapturingAudio}
            >
              {isCapturingAudio ? 'Capturing...' : 'PC Audio'}
            </button>
          )}
        </div>
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg p-4 mt-6 text-left">
          <h4 className="font-bold text-gray-200 mb-2">Important Note:</h4>
          <ul className="list-disc pl-5 text-gray-300">
            <li>To use the PC Audio feature, you need to enable the "Share audio" option when selecting the capture source.</li>
            <li>Remarque : Pour utiliser la fonction PC Audio, vous devez activer l'option « Partager l'audio » lors de la sélection de la source de capture.</li>
            <li>ملاحظة: باش تخدم ب ميزة التقاط الصوت من الحاسوب، خاصك تفعل خيار "مشاركة الصوت" ملي تختار مصدر الالتقاط.</li>
          </ul>
        </div>
        {!hasMicrophone && (
          <div className="text-red-500 mt-4">
            Microphone access denied. Please allow microphone access in your browser settings.
          </div>
        )}
        {recognizedSong && recognizedSong.track && (
          <div className="mt-10 p-6 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">{recognizedSong.track.title}</h2>
            <p className="mb-4 text-gray-200">By: {recognizedSong.track.subtitle}</p>
            {recognizedSong.track.images && recognizedSong.track.images.coverart && (
              <img src={recognizedSong.track.images.coverart} alt="Cover Art" className="mb-6 rounded-md w-64 h-64 object-cover mx-auto" />
            )}
            <p className="text-gray-300">Album: {recognizedSong.track.albumadamid ? `Album ID: ${recognizedSong.track.albumadamid}` : 'N/A'}</p>
            <a href={recognizedSong.track.url} target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline mt-4 inline-block">
              View on Shazam
            </a>
            <button
              onClick={clearResults}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded mt-4"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
