
  import React, { useState, useRef, useEffect } from 'react';
  import { Card, CardContent } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { BookOpen, Upload, Music } from 'lucide-react';
  
  // Predefiniowana biblioteka muzyki (dodaj własne linki)
  const MUSIC_LIBRARY = {
    sadness: [
      'https://sparklyfrog2060.github.io/ebook-music/atmospheric-deep-in-the-zone-259256.mp3',
      'https://sparklyfrog2060.github.io/ebook-music/smutek2.mp3',
    ],
    surprise: [
      'https://sparklyfrog2060.github.io/ebook-music/niespodzianka1.mp3',
      'https://sparklyfrog2060.github.io/ebook-music/niespodzianka2.mp3',
    ],
    fear: [
      'https://sparklyfrog2060.github.io/ebook-music/strach1.mp3',
      'https://sparklyfrog2060.github.io/ebook-music/strach2.mp3',
    ],
    joy: [
      'https://sparklyfrog2060.github.io/ebook-music/joy1.mp3',
      'https://sparklyfrog2060.github.io/ebook-music/joy2.mp3',
    ],
    neutral: [
      'https://sparklyfrog2060.github.io/ebook-music/science-documentary-169621.mp3',
      'https://sparklyfrog2060.github.io/ebook-music/neutral2.mp3',
    ],
    anger: [
      'https://sparklyfrog2060.github.io/ebook-music/anger1.mp3',
      'https://sparklyfrog2060.github.io/ebook-music/anger2.mp3',
    ],
    disgust: [
      'https://sparklyfrog2060.github.io/ebook-music/disgust.mp3',
      'https://sparklyfrog2060.github.io/ebook-music/disgust.mp3',
    ]
  };
  
  const EbookReader = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [pages, setPages] = useState([]);
    const [currentMood, setCurrentMood] = useState('neutral');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const audioRef = useRef(null);
  
    const analyzeTextWithAI = async (text) => {
      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        const { mood } = await response.json();
        setCurrentMood(mood);
        playMoodMusic(mood);
      } catch (error) {
        console.error('Błąd analizy:', error);
      }
      setIsAnalyzing(false);
    };
  
    const playMoodMusic = (mood) => {
      const moodTracks = MUSIC_LIBRARY[mood];
      if (moodTracks?.length) {
        const randomTrack = moodTracks[Math.floor(Math.random() * moodTracks.length)];
        if (audioRef.current) {
          audioRef.current.src = randomTrack;
          audioRef.current.play();
        }
      }
    };
  
    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target.result;
        // Dzielimy tekst na strony (co 1000 znaków)
        const pageSize = 1000;
        const pagesArray = [];
        for (let i = 0; i < content.length; i += pageSize) {
          pagesArray.push(content.slice(i, i + pageSize));
        }
        setPages(pagesArray);
        if (pagesArray.length > 0) {
          analyzeTextWithAI(pagesArray[0]);
        }
      };
      
      reader.readAsText(file);
    };
  
    const changePage = async (direction) => {
      const newPage = currentPage + direction;
      if (newPage >= 0 && newPage < pages.length) {
        setCurrentPage(newPage);
        await analyzeTextWithAI(pages[newPage]);
      }
    };
  
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Reader
          </h1>
          <p className="text-gray-600 mt-2">
            Inteligentny czytnik z automatycznym doborem muzyki
          </p>
        </div>
  
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".txt,.epub"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <BookOpen className="text-gray-500" />
            </div>
          </CardContent>
        </Card>
  
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="min-h-[400px] bg-white rounded p-4">
              {pages[currentPage] ? (
                <div className="prose max-w-none">
                  <p>{pages[currentPage]}</p>
                  <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    {isAnalyzing ? 'Analizuję nastrój...' : `Aktualny nastrój: ${currentMood}`}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <Upload className="w-8 h-8 mr-2" />
                  <span>Wczytaj książkę aby rozpocząć</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
  
        <div className="flex justify-between items-center">
          <Button
            onClick={() => changePage(-1)}
            disabled={currentPage === 0 || isAnalyzing}
          >
            Poprzednia strona
          </Button>
          <span>Strona {currentPage + 1} z {pages.length}</span>
          <Button
            onClick={() => changePage(1)}
            disabled={currentPage >= pages.length - 1 || isAnalyzing}
          >
            Następna strona
          </Button>
        </div>
  
        <audio ref={audioRef} controls className="w-full mt-4" />
      </div>
    );
  };
  
  export default EbookReader;