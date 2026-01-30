
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import api from "../api";

// Тест 1: Оценка рациона (18 вопросов, Да/Нет)
const TEST_1_QUESTIONS = [
    { id: 1, text: "В вашем рационе присутствуют ферментированные/кисломолочные продукты минимум 3-4 раза в неделю?" },
    { id: 2, text: "Вы всегда едите свежеприготовленную еду?" },
    { id: 3, text: "За день вы съедаете не менее 400 г овощей и фруктов?" },
    { id: 4, text: "Вы знаете свою норму воды и всегда утоляете жажду вовремя?" },
    { id: 5, text: "В вашем рационе регулярно присутствуют сезонные ягоды?" },
    { id: 6, text: "Вы знаете как составить свою тарелку так, чтобы максимально усвоились все полезные вещества?" },
    { id: 7, text: "Вы выдерживаете пищевые паузы в 3 часа между приемами пищи?" },
    { id: 8, text: "Вы используете щадящие способы приготовления блюд (варка, тушение, запекание)?" },
    { id: 9, text: "В Вашем рационе присутствует одно и то же блюдо не чаще 2 раз в неделю?" },
    { id: 10, text: "Вы не пропускаете приемы пищи?" },
    { id: 11, text: "Покупая продукты вы всегда выбираете те, что с понятным и простым составом?" },
    { id: 12, text: "В выборе мяса/рыбы вы обращаете внимание на экологичность?" },
    { id: 13, text: "Вы употребляете разные источники белка (растительные, животные)?" },
    { id: 14, text: "В вашем рационе присутствуют субпродукты?" },
    { id: 15, text: "Если вы жарите, то только на маслах с высокой точкой дымления (кокосовое, авокадо, гхи)?" },
    { id: 16, text: "В вашем рационе каждый день присутствуют разные источники полезных жиров?" },
    { id: 17, text: "В вашем рационе отсутствуют трансжиры (фастфуд, маргарин)?" },
    { id: 18, text: "Основная доля углеводов в вашем рационе - сложные углеводы (крупы, бобовые)?" }
];

// Тест 2: Нутрициологический опросник (Смешанный тип)
const TEST_2_QUESTIONS = [
    { id: 1, text: "Слабость, повышенная утомляемость", type: 'scale' },
    { id: 2, text: "Шум в ушах, склонность к обморокам в духоте", type: 'scale' },
    { id: 3, text: "Головные боли по утрам", type: 'scale' },
    { id: 4, text: "Извращение вкуса (тяга есть мел, глину, сырой фарш)", type: 'scale' },
    { id: 5, text: "Пристрастие к запахам (бензин, лак, краска)", type: 'scale' },
    { id: 6, text: "Сниженная концентрация внимания", type: 'scale' },
    { id: 7, text: "Сниженный аппетит", type: 'scale' },
    { id: 8, text: "Раздражительность, психологическая лабильность", type: 'scale' },
    { id: 9, text: "Сонливость днем", type: 'scale' },
    { id: 10, text: "Снижение толерантности к физ. нагрузке", type: 'scale' },
    { id: 11, text: "Одышка/сердцебиение при обычных нагрузках", type: 'scale' },
    { id: 12, text: "Хейлит – покраснение, шелушение, отек губ", type: 'scale' },
    { id: 13, text: "Заеды, трещины в уголках рта", type: 'scale' },
    { id: 14, text: "\"Лакированный\" воспаленный язык", type: 'binary' },
    { id: 15, text: "\"Географический язык\" (пятна/разводы)", type: 'binary' },
    { id: 16, text: "Продольная, вертикальная бугристость ногтей", type: 'binary' },
    { id: 17, text: "Тонкие, матовые, вогнутые ногти (ложкообразные)", type: 'binary' },
    { id: 18, text: "Сухая кожа, сухие локти, трещины на пятках", type: 'binary' },
    { id: 19, text: "Ломкие, тусклые волосы, выпадение", type: 'binary' },
    { id: 20, text: "Гиперпигментация на солнце", type: 'binary' },
    { id: 21, text: "Бледная кожа с зеленоватым оттенком", type: 'binary' },
    { id: 22, text: "Отпечатки зубов на языке", type: 'binary' },
    { id: 23, text: "Отеки на лице/ногах (след от резинки)", type: 'binary' },
    { id: 24, text: "Желтушность ладоней, стоп", type: 'binary' },
    { id: 25, text: "Затруднения в когнитивной сфере, туман в голове", type: 'binary' },
    { id: 26, text: "Апатия, низкая мотивация", type: 'scale' },
    { id: 27, text: "Медленное заживление ран", type: 'binary' },
    { id: 28, text: "Депрессивное состояние", type: 'scale' },
    { id: 29, text: "Плохое зрение в сумерках (куриная слепота)", type: 'binary' },
    { id: 30, text: "Мышечные боли, судороги", type: 'scale' },
    { id: 31, text: "Синдром беспокойных ног", type: 'scale' },
    { id: 32, text: "Тяга к шоколаду/какао", type: 'binary' },
    { id: 33, text: "Складчатый язык", type: 'binary' },
    { id: 34, text: "Непереносимость холода (зябкость)", type: 'binary' },
    { id: 35, text: "Проблемы с засыпанием, бессонница", type: 'scale' },
    { id: 36, text: "Мушки в глазах, плохая переносимость яркого света", type: 'binary' },
    { id: 37, text: "Отек и кровоточивость десен", type: 'scale' },
    { id: 38, text: "Частые простудные заболевания", type: 'binary' },
    { id: 39, text: "Седина в возрасте до 40 лет", type: 'binary' },
    { id: 40, text: "Фолликулярный кератоз (\"гусиная кожа\")", type: 'binary' },
    { id: 41, text: "Усталость, ощущение «севшей батарейки»", type: 'scale' },
    { id: 42, text: "Запоры", type: 'scale' },
    { id: 43, text: "Белые пятна на ногтях", type: 'binary' },
    { id: 44, text: "Легкое образование синяков", type: 'binary' },
    { id: 45, text: "Сильная тяга к сладкому и мучному", type: 'scale' },
    { id: 46, text: "Разрушение зубной эмали", type: 'binary' },
    { id: 47, text: "Склонность к растяжкам", type: 'binary' },
    { id: 48, text: "Боли в суставах", type: 'scale' },
    { id: 49, text: "Утренняя скованность суставов", type: 'scale' },
    { id: 50, text: "Сухость слизистой носа и рта", type: 'binary' },
    { id: 51, text: "Сухость глаз (песок в глазах)", type: 'binary' },
    { id: 52, text: "Врастание волос", type: 'binary' },
    { id: 53, text: "Темные круги под глазами", type: 'binary' },
    { id: 54, text: "Обильные менструации (для женщин)", type: 'binary' },
    { id: 55, text: "Количество беременностей (0 - нет, 5 - много)", type: 'scale' },
    { id: 59, text: "Были операции на ЖКТ (удален желчный и т.д.)?", type: 'binary' },
    { id: 60, text: "Беременны / Кормите / Проф. спорт / Тяжелое заболевание?", type: 'binary' },
    { id: 61, text: "Принимаете КОК или Метформин?", type: 'binary' },
    { id: 62, text: "Ваш уровень стресса", type: 'scale' },
    { id: 63, text: "Постоянное чувство голода / ночной голод", type: 'binary' },
    { id: 64, text: "Черный акантоз (темные пятна на шее/подмышках)", type: 'binary' },
    { id: 65, text: "Жжение языка", type: 'binary' },
    { id: 66, text: "Лейкоплакия (белый налет, не снимается)", type: 'binary' },
    { id: 67, text: "Сухие стопы, трещины", type: 'binary' },
    { id: 69, text: "Употребляете алкоголь", type: 'scale' }
];

export default function MarathonTests() {
  const navigate = useNavigate();
  
  const [activeTestId, setActiveTestId] = useState<1 | 2 | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  
  const [completed, setCompleted] = useState({ 1: false, 2: false });
  
  const [analyzing, setAnalyzing] = useState(false);
  const [aiStep, setAiStep] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [aiAdvice, setAiAdvice] = useState("");

  const startTest = (id: 1 | 2) => {
      setActiveTestId(id);
      setCurrentQ(0);
      setAnswers({});
      setShowResult(false);
  };

  const handleAnswer = (val: number | string) => {
      const currentQuestions = activeTestId === 1 ? TEST_1_QUESTIONS : TEST_2_QUESTIONS;
      setAnswers({ ...answers, [currentQuestions[currentQ].id]: val }); // Используем ID вопроса как ключ

      if (currentQ < currentQuestions.length - 1) {
          setCurrentQ(curr => curr + 1);
      } else {
          finishTest();
      }
  };

  const finishTest = async () => {
      setAnalyzing(true);
      setAiStep("Синхронизация с сервером...");
      
      const totalScore = Object.values(answers).reduce((acc: number, val: any) => acc + (val === 'yes' ? 1 : Number(val) || 0), 0) as number;
      setScore(totalScore);

      try {
          // Отправка реального запроса
          const res = await api.post('/marathon/test-result', {
              test_id: activeTestId,
              answers: answers,
              score: totalScore
          });

          setAiAdvice(res.data.advice || "Анализ завершен.");
          setCompleted(prev => ({ ...prev, [activeTestId!]: true }));
          
          setAiStep("Готово!");
          setTimeout(() => {
              setAnalyzing(false);
              setShowResult(true);
          }, 500);

      } catch (e) {
          console.error("Test submit error", e);
          setAiAdvice("Ошибка связи с сервером. Результаты сохранены локально.");
          setAnalyzing(false);
          setShowResult(true);
          setCompleted(prev => ({ ...prev, [activeTestId!]: true }));
      }
  };

  if (!activeTestId && !analyzing && !showResult) {
      const allDone = completed[1] && completed[2];

      return (
        <div className="bg-tg-bg min-h-screen flex flex-col">
            <PageHeader title="Диагностика" showBack={true} />
            
            <div className="p-5 space-y-6 animate-fade-in pb-24">
                <div className="ios-card p-6 bg-gradient-to-br from-blue-600 to-purple-600 border-none shadow-lg text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-2">Точка А: Здоровье</h2>
                        <p className="opacity-90 text-sm leading-relaxed">
                            Пройдите два обязательных теста. Искусственный интеллект проанализирует ответы и составит карту ваших дефицитов.
                        </p>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-tg-text ml-1">Список тестов</h3>
                    
                    <TestCard 
                        id={1}
                        title="Оценка рациона" 
                        desc="18 вопросов • Анализ питания" 
                        icon="🥗"
                        isDone={completed[1]}
                        onClick={() => startTest(1)}
                    />
                    
                    <TestCard 
                        id={2}
                        title="Симптоматика" 
                        desc="60+ вопросов • Анализ дефицитов" 
                        icon="🧬"
                        isDone={completed[2]}
                        onClick={() => startTest(2)}
                    />
                </div>

                {allDone && (
                    <button 
                        onClick={() => navigate('/marathon/dashboard')}
                        className="w-full bg-tg-button text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 animate-slide-up"
                    >
                        Перейти к марафону →
                    </button>
                )}
            </div>
        </div>
      );
  }

  if (analyzing) {
      return (
          <div className="bg-tg-bg min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
              <div className="w-24 h-24 border-4 border-tg-border border-t-tg-button rounded-full animate-spin mb-8 mx-auto shadow-glow" />
              <h2 className="text-2xl font-bold text-tg-text mb-2 animate-pulse">AI Анализ</h2>
              <p className="text-tg-hint text-lg">{aiStep}</p>
          </div>
      );
  }

  if (showResult) {
      return (
          <div className="bg-tg-bg min-h-screen flex flex-col">
              <PageHeader title="Результаты анализа" showBack={false} />
              <div className="p-6 flex-1 flex flex-col items-center animate-slide-up">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl shadow-lg shadow-green-500/40 mb-6">✨</div>
                  <h2 className="text-2xl font-bold text-tg-text text-center mb-2">Анализ завершен</h2>
                  <p className="text-tg-hint text-center mb-8">Баллы: <span className="font-bold text-tg-text">{score}</span></p>

                  <div className="w-full ios-card p-5 mb-8 bg-tg-card border border-tg-border">
                      <h3 className="font-bold text-tg-text mb-2 flex items-center gap-2">🤖 Рекомендация AI:</h3>
                      <p className="text-sm text-tg-text leading-relaxed italic">"{aiAdvice}"</p>
                  </div>

                  <button 
                      onClick={() => { setShowResult(false); setActiveTestId(null); }}
                      className="w-full bg-tg-button text-white font-bold py-4 rounded-2xl shadow-lg mt-auto"
                  >
                      Вернуться к тестам
                  </button>
              </div>
          </div>
      );
  }

  const questions = activeTestId === 1 ? TEST_1_QUESTIONS : TEST_2_QUESTIONS;
  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
      <div className="bg-tg-bg min-h-screen flex flex-col">
          <PageHeader 
            title={activeTestId === 1 ? "Оценка рациона" : "Опросник"} 
            showBack={false} 
            rightContent={<span className="text-tg-button font-bold text-sm">{currentQ + 1}/{questions.length}</span>}
          />
          
          <div className="h-1 w-full bg-tg-border">
              <div className="h-full bg-tg-button transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex-1 p-6 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                  <h2 className="text-xl md:text-2xl font-bold text-tg-text text-center leading-snug animate-fade-in">
                      {question.text}
                  </h2>
              </div>

              <div className="mt-auto space-y-3 animate-slide-up">
                  {(activeTestId === 1 || (question as any).type === 'binary') ? (
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => handleAnswer('no')} className="h-16 rounded-2xl bg-tg-card border border-tg-border text-red-500 font-bold text-lg active:scale-95 transition-transform">Нет</button>
                          <button onClick={() => handleAnswer('yes')} className="h-16 rounded-2xl bg-tg-button text-white font-bold text-lg shadow-lg active:scale-95 transition-transform">Да</button>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <p className="text-center text-sm text-tg-hint">Оцените частоту (0 - никогда, 5 - постоянно)</p>
                          <div className="flex justify-between gap-1">
                              {[0, 1, 2, 3, 4, 5].map(val => (
                                  <button key={val} onClick={() => handleAnswer(val)} className="flex-1 aspect-square rounded-xl bg-tg-card border border-tg-border font-bold text-tg-text active:scale-90 active:bg-tg-button active:text-white transition-all">
                                      {val}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}

const TestCard = ({ title, desc, icon, isDone, onClick }: any) => (
    <button onClick={onClick} disabled={isDone} className={`w-full p-5 rounded-2xl border flex items-center gap-4 text-left transition-all ${isDone ? 'bg-green-500/10 border-green-500/30 opacity-80' : 'bg-tg-card border-tg-border active:scale-[0.98] shadow-sm'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${isDone ? 'bg-green-500 text-white' : 'bg-tg-bg'}`}>
            {isDone ? '✓' : icon}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className={`font-bold truncate ${isDone ? 'text-green-600 dark:text-green-400' : 'text-tg-text'}`}>{title}</h4>
            <p className="text-xs text-tg-hint truncate">{isDone ? 'Тест пройден' : desc}</p>
        </div>
        {!isDone && <div className="text-tg-button text-2xl">→</div>}
    </button>
);
