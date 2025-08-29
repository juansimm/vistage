"use client";
import React, { useState } from "react";
import { PhaseSelector } from "./PhaseSelector";
import { SessionControls } from "./SessionControls";
import { PromptEditor } from "./PromptEditor";
import { ConversationPicker } from "./ConversationPicker";
import { KnowledgeBase } from "./KnowledgeBase";
import { AgentControls } from "./AgentControls";
import { SessionState } from "../lib/types";

interface SidebarProps {
  currentPhase: string | null;
  onPhaseChange: (phaseId: string) => void;
  sessionState: SessionState;
  onStartSession: () => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onEndSession: () => void;
  onPromptUpdate: (prompt: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  industryId: string;
  onIndustryChange: (industryId: string) => void;
}

type SidebarTab = 'session' | 'phases' | 'prompts' | 'knowledge' | 'history';

export const Sidebar: React.FC<SidebarProps> = ({
  currentPhase,
  onPhaseChange,
  sessionState,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onEndSession,
  onPromptUpdate,
  isCollapsed,
  onToggleCollapse,
  industryId,
  onIndustryChange,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('session');

  const sidebarTabs = [
    {
      id: 'session' as SidebarTab,
      name: 'Sesión',
      icon: '🎯',
      description: 'Controles de sesión'
    },
    {
      id: 'phases' as SidebarTab,
      name: 'Fases',
      icon: '📋',
      description: 'Fases de coaching'
    },
    {
      id: 'prompts' as SidebarTab,
      name: 'Prompts',
      icon: '✏️',
      description: 'Editor de prompts'
    },
    {
      id: 'knowledge' as SidebarTab,
      name: 'Knowledge',
      icon: '📚',
      description: 'Base de conocimiento'
    },
    {
      id: 'history' as SidebarTab,
      name: 'Historial',
      icon: '📜',
      description: 'Conversaciones previas'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'session':
        return (
          <div className="space-y-6">
            <SessionControls
              sessionState={sessionState}
              onStartSession={onStartSession}
              onPauseSession={onPauseSession}
              onResumeSession={onResumeSession}
              onEndSession={onEndSession}
              currentPhase={currentPhase}
            />
            {/* Removed duplicate AgentControls - it's already in SessionControls */}
          </div>
        );
      case 'phases':
        return (
          <PhaseSelector
            currentPhase={currentPhase}
            onPhaseChange={onPhaseChange}
            isSessionActive={sessionState.isActive}
          />
        );
      case 'prompts':
        return (
          <PromptEditor
            currentPhase={currentPhase}
            onPromptUpdate={onPromptUpdate}
            isSessionActive={sessionState.isActive}
            industryId={industryId}
            onIndustryChange={onIndustryChange}
          />
        );
      case 'knowledge':
        return <KnowledgeBase />;
      case 'history':
        return <ConversationPicker />;
      default:
        return null;
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 border-r border-stone-700/30 bg-stone-800/80 backdrop-blur-sm flex flex-col items-center py-4 space-y-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-stone-400 hover:text-yellow-400 hover:bg-stone-700/50 rounded-lg transition-all duration-300 transform hover:scale-110"
        >
          ▶️
        </button>
        {sidebarTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-2 rounded-lg transition-all duration-300 text-xl transform hover:scale-110 ${
              activeTab === tab.id
                ? 'modern-button text-stone-900 font-bold'
                : 'text-stone-400 hover:text-yellow-400 hover:bg-stone-700/50'
            }`}
            title={tab.name}
          >
            {tab.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-stone-700/30 bg-stone-800/60 backdrop-blur-md flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-stone-700/30 flex items-center justify-between glass">
        <h2 className="text-lg font-bold text-yellow-400 drop-shadow-glowYellow tracking-wide">Panel de Control</h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 text-stone-400 hover:text-yellow-400 hover:bg-stone-700/50 rounded transition-all duration-300 transform hover:scale-110"
        >
          ◀️
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-stone-700/30 bg-stone-800/30">
        {sidebarTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 px-3 py-3 text-xs font-medium transition-all duration-300 border-b-2 hover:transform hover:-translate-y-0.5 ${
              activeTab === tab.id
                ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 backdrop-blur-sm'
                : 'border-transparent text-stone-400 hover:text-yellow-400 hover:bg-stone-700/40'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-base">{tab.icon}</span>
              <span className="truncate">{tab.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-stone-800/20">
        {renderTabContent()}
      </div>

      {/* Footer Status */}
      <div className="p-4 border-t border-stone-700/30 glass">
        <div className="text-xs text-stone-400 text-center">
          <p className="mb-2 font-medium tracking-wide">Vistage AI Voice Session</p>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              sessionState.isActive 
                ? 'bg-green-500 animate-pulse drop-shadow-glowGreen' 
                : 'bg-stone-500'
            }`}></div>
            <span className={`font-medium ${
              sessionState.isActive ? 'text-green-400' : 'text-stone-400'
            }`}>
              {sessionState.isActive ? 'Sesión Activa' : 'Sesión Inactiva'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
