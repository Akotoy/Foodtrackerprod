
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { compressImage } from "../utils/imageOptimizer";
import ScanResultModal from "../components/scanner/ScanResultModal";

export default function Scanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingText, setLoadingText] = useState("AI думает...");
  const [scannedData, setScannedData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textQuery, setTextQuery] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processFile(file);
  };

  const processFile = async (file: File) => {
      setAnalyzing(true);
      setShowTextInput(false);
      
      try {
          setLoadingText("Сжимаю...");
          const compressedBase64 = await compressImage(file);

          setLoadingText("Анализирую...");
          const res = await api.post('/analyze-food', {
              imageBase64: compressedBase64
          });

          setScannedData(res.data);
          setShowModal(true);
      } catch (err) {
          console.error(err);
          alert("Не удалось распознать фото.");
      } finally {
          setAnalyzing(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
  };

  const handleTextSubmit = async () => {
      if (!textQuery.trim()) return;
      setAnalyzing(true);
      setLoadingText("Ищу...");
      
      try {
          const res = await api.post('/analyze-food', { textDescription: textQuery });
          setScannedData(res.data);
          setShowModal(true);
          setTextQuery("");
      } catch (err) {
          alert("Ошибка анализа.");
      } finally {
          setAnalyzing(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-[var(--tg-theme-secondary-bg-color)] flex flex-col z-[100]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-[var(--ios-card)] shadow-sm flex items-center justify-center text-[var(--ios-text)] active:scale-90 transition-transform"
          >
              ✕
          </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 animate-fade-in">
          
          {analyzing ? (
              <div className="flex flex-col items-center animate-pulse">
                  <div className="w-24 h-24 rounded-full bg-[var(--ios-blue)] flex items-center justify-center mb-6 shadow-xl shadow-blue-500/40">
                      <span className="text-4xl animate-spin">🪄</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--ios-text)]">{loadingText}</h2>
              </div>
          ) : showTextInput ? (
              <div className="w-full max-w-sm glass-panel p-6 rounded-[32px] animate-scale-up">
                  <h3 className="text-xl font-bold text-[var(--ios-text)] mb-4 text-center">Опишите еду</h3>
                  <textarea 
                      value={textQuery}
                      onChange={(e) => setTextQuery(e.target.value)}
                      placeholder="Например: Борщ со сметаной, 300г..."
                      className="w-full h-32 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-4 text-[var(--ios-text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)] transition-all mb-4"
                  />
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setShowTextInput(false)}
                          className="flex-1 py-3.5 rounded-2xl font-bold text-[var(--ios-hint)] bg-[var(--tg-theme-secondary-bg-color)] active:scale-95 transition-transform"
                      >
                          Назад
                      </button>
                      <button 
                          onClick={handleTextSubmit}
                          disabled={!textQuery.trim()}
                          className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-[var(--ios-blue)] shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                      >
                          Готово
                      </button>
                  </div>
              </div>
          ) : (
              <div className="w-full max-w-xs grid gap-5">
                  <div className="text-center mb-4">
                      <h1 className="text-3xl font-black text-[var(--ios-text)] mb-2">Что едим?</h1>
                      <p className="text-[var(--ios-hint)]">Сфотографируйте еду или напишите текстом</p>
                  </div>

                  <label className="relative group cursor-pointer active:scale-95 transition-transform duration-200">
                      <div className="bg-[var(--ios-blue)] text-white rounded-[28px] h-40 flex flex-col items-center justify-center shadow-xl shadow-blue-500/30">
                          <span className="text-5xl mb-2 filter drop-shadow-md">📸</span>
                          <span className="font-bold text-lg">Камера</span>
                      </div>
                      <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          className="hidden" 
                          onChange={handleFileChange} 
                      />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                      <label className="bg-[var(--ios-card)] h-32 rounded-[28px] flex flex-col items-center justify-center shadow-md cursor-pointer active:scale-95 transition-transform border border-transparent hover:border-[var(--ios-blue)]">
                          <span className="text-3xl mb-2">🖼️</span>
                          <span className="font-bold text-sm text-[var(--ios-text)]">Галерея</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>

                      <button 
                          onClick={() => setShowTextInput(true)}
                          className="bg-[var(--ios-card)] h-32 rounded-[28px] flex flex-col items-center justify-center shadow-md active:scale-95 transition-transform border border-transparent hover:border-[var(--ios-blue)]"
                      >
                          <span className="text-3xl mb-2">⌨️</span>
                          <span className="font-bold text-sm text-[var(--ios-text)]">Текст</span>
                      </button>
                  </div>
              </div>
          )}
      </div>

      <ScanResultModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          data={scannedData} 
          onSaveSuccess={() => { setShowModal(false); navigate('/home'); }} 
      />
    </div>
  );
}
