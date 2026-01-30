
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHomeData } from "../hooks/useHomeData";

import HeaderCard from "../components/home/HeaderCard";
import MacrosCard from "../components/home/MacrosCard";
import TrackerWidget from "../components/home/TrackerWidget";
import FoodList from "../components/home/FoodList";
import EditFoodModal from "../components/home/EditFoodModal";

export default function Home() {
  const navigate = useNavigate();
  const { data, loading, water, weight, lastWeightDate, updateWater, refresh } = useHomeData();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openEdit = (item: any) => {
      setSelectedItem(item);
      setIsOpen(true);
  };

  const formatDate = (dateStr: string | null) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  if (loading || !data) return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-[var(--ios-blue)] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-full pb-32 animate-fade-in"> 
      
      <HeaderCard data={data} />
      
      {/* Marathon Banner */}
      <div className="px-4 mt-4">
        <button
          onClick={() => navigate('/marathon/entry')}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[22px] p-4 shadow-lg shadow-indigo-500/30 text-white relative overflow-hidden active:scale-98 transition-transform"
        >
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md text-xl">
                        🏃‍♀️
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-base">Марафон</h3>
                        <p className="text-indigo-100 text-xs font-medium">Твой путь к результату</p>
                    </div>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                    →
                </div>
            </div>
        </button>
      </div>

      <MacrosCard current={data.current} goals={data.goals} />

      <div className="grid grid-cols-2 gap-3 px-4 mt-4">
          <TrackerWidget 
            title="Вода" 
            value={water} 
            unit="мл" 
            icon="💧"
            color="#5AC8FA"
            max={2000}
            mode="stepper"
            onSubtract={() => updateWater(-50)} 
            onAdd={() => updateWater(250)} 
          />
          
          <TrackerWidget 
            title="Вес" 
            value={weight} 
            unit="кг" 
            icon="⚖️"
            color="#AF52DE" 
            mode="readonly"
            subtitle={formatDate(lastWeightDate) || undefined}
          />
      </div>

      <FoodList logs={data.logs} onItemClick={openEdit} />

      <EditFoodModal isOpen={isOpen} onClose={setIsOpen} item={selectedItem} onRefresh={refresh} />
    </div>
  );
}
