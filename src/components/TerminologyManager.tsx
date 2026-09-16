import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Search,
  Sparkles,
  Filter,
  Check,
  X,
  Edit2,
  BookOpen,
} from 'lucide-react';
import { TerminologyItem, EntityType } from '../types';
import { DEFAULT_TERMINOLOGY } from '../services/storage';

interface TerminologyManagerProps {
  terminology: TerminologyItem[];
  setTerminology: React.Dispatch<React.SetStateAction<TerminologyItem[]>>;
  onScanFromDoc?: () => void;
  isScanning?: boolean;
}

const ENTITY_TYPES: { id: EntityType; label: string; badgeColor: string }[] = [
  { id: 'character', label: 'Character', badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  { id: 'place', label: 'Place', badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
  { id: 'ability', label: 'Ability', badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  { id: 'object', label: 'Object / Weapon', badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { id: 'organization', label: 'Organization', badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' },
  { id: 'title', label: 'Title / Rank', badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
  { id: 'other', label: 'Other', badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
];

export function TerminologyManager({
  terminology,
  setTerminology,
  onScanFromDoc,
  isScanning = false,
}: TerminologyManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New term form state
  const [newOriginal, setNewOriginal] = useState('');
  const [newPreferred, setNewPreferred] = useState('');
  const [newType, setNewType] = useState<EntityType>('character');
  const [newLocked, setNewLocked] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOriginal, setEditOriginal] = useState('');
  const [editPreferred, setEditPreferred] = useState('');
  const [editType, setEditType] = useState<EntityType>('character');
  const [editLocked, setEditLocked] = useState(true);

  const handleAddTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOriginal.trim()) return;

    const newItem: TerminologyItem = {
      id: `term-${Date.now()}`,
      original: newOriginal.trim(),
      preferredTranslation: newPreferred.trim() || newOriginal.trim(),
      type: newType,
      locked: newLocked,
    };

    setTerminology((prev) => [newItem, ...prev]);
    setNewOriginal('');
    setNewPreferred('');
    setIsAddingNew(false);
  };

  const handleStartEdit = (item: TerminologyItem) => {
    setEditingId(item.id);
    setEditOriginal(item.original);
    setEditPreferred(item.preferredTranslation);
    setEditType(item.type);
    setEditLocked(item.locked);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editOriginal.trim()) return;

    setTerminology((prev) =>
      prev.map((item) =>
        item.id === editingId
          ? {
              ...item,
              original: editOriginal.trim(),
              preferredTranslation: editPreferred.trim() || editOriginal.trim(),
              type: editType,
              locked: editLocked,
            }
          : item
      )
    );
    setEditingId(null);
  };

  const handleDeleteTerm = (id: string) => {
    setTerminology((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleLock = (id: string) => {
    setTerminology((prev) =>
      prev.map((item) => (item.id === id ? { ...item, locked: !item.locked } : item))
    );
  };

  const handleResetDefaults = () => {
    setTerminology(DEFAULT_TERMINOLOGY);
  };

  const filteredItems = terminology.filter((item) => {
    const matchesSearch =
      item.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.preferredTranslation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || item.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Terminology & Entity Memory
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold">
              {terminology.length} Terms
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define character names, fantasy places, abilities, and weapons to guarantee consistency across chapters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onScanFromDoc && (
            <button
              type="button"
              id="btn-scan-terms-tab"
              onClick={onScanFromDoc}
              disabled={isScanning}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isScanning ? 'Scanning...' : 'Scan Active Doc'}</span>
            </button>
          )}

          <button
            type="button"
            id="btn-add-new-term"
            onClick={() => setIsAddingNew((v) => !v)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Term</span>
          </button>
        </div>
      </div>

      {/* Add New Term Card */}
      {isAddingNew && (
        <form
          onSubmit={handleAddTerm}
          id="form-add-term"
          className="rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/30 dark:bg-indigo-950/20 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              New Terminology Entry
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Original Term / Name *
              </label>
              <input
                type="text"
                id="input-new-original"
                required
                value={newOriginal}
                onChange={(e) => setNewOriginal(e.target.value)}
                placeholder="e.g. Kael, Eldoria, Shadow Burst"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Preferred Translation
              </label>
              <input
                type="text"
                id="input-new-preferred"
                value={newPreferred}
                onChange={(e) => setNewPreferred(e.target.value)}
                placeholder="Keep in English or specify Urdu transliteration"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Entity Type
              </label>
              <select
                id="select-new-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as EntityType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <label
                onClick={() => setNewLocked((v) => !v)}
                className="flex items-center gap-2 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer h-10 w-full"
              >
                <input
                  type="checkbox"
                  checked={newLocked}
                  onChange={() => {}}
                  className="rounded text-indigo-600"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Lock Strict
                </span>
              </label>

              <button
                type="submit"
                id="btn-save-new-term"
                className="px-5 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center flex-shrink-0"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            id="input-search-terminology"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search original or translation..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedTypeFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          {ENTITY_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedTypeFilter === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-auto whitespace-nowrap"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Terminology Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Original Term</th>
                <th className="py-3.5 px-4">Preferred Translation</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4 text-center">Locked</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No terminology items found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isEditing = editingId === item.id;
                  const typeObj =
                    ENTITY_TYPES.find((t) => t.id === item.type) || ENTITY_TYPES[6];

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Original */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editOriginal}
                            onChange={(e) => setEditOriginal(e.target.value)}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 w-full text-xs"
                          />
                        ) : (
                          item.original
                        )}
                      </td>

                      {/* Preferred Translation */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editPreferred}
                            onChange={(e) => setEditPreferred(e.target.value)}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 w-full text-xs"
                          />
                        ) : (
                          item.preferredTranslation
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as EntityType)}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          >
                            {ENTITY_TYPES.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${typeObj.badgeColor}`}
                          >
                            {typeObj.label}
                          </span>
                        )}
                      </td>

                      {/* Locked Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editLocked}
                            onChange={(e) => setEditLocked(e.target.checked)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleLock(item.id)}
                            className={`p-1.5 rounded-lg transition-colors inline-flex items-center justify-center ${
                              item.locked
                                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title={item.locked ? 'Locked (Strict Preservation)' : 'Unlocked'}
                          >
                            {item.locked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Edit Term"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTerm(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                title="Delete Term"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
