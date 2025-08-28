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
  onToggleCollapse
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
            {sessionState.isActive && (
              <div className="border-t border-gray-600/50 pt-6">
                <AgentControls />
              </div>
            )}
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
      <div className="w-16 border-r border-gray-700 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          ▶️
        </button>
        {sidebarTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-2 rounded-lg transition-colors text-xl ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
    <div className="w-80 border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Panel de Control</h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
        >
          ◀️
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-gray-700">
        {sidebarTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 px-3 py-3 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'
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
      <div className="flex-1 overflow-y-auto p-4">
        {renderTabContent()}
      </div>

      {/* Footer Status */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          <p className="mb-1">Vistage AI Voice Session</p>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${sessionState.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span>{sessionState.isActive ? 'Sesión Activa' : 'Sesión Inactiva'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};