import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  User,
  Calendar,
  ChevronDown
} from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Call back Tasnim Rahman', desc: 'Wants to discuss pricing plans for wholesale packages.', priority: 'High', status: 'Open', dueDate: '2026-05-21', assignee: 'Support Member A' },
    { id: 2, title: 'Reply to Zunayed WhatsApp message', desc: 'Reply with the standard onboarding details document.', priority: 'Medium', status: 'In Progress', dueDate: '2026-05-20', assignee: 'Support Member B' },
    { id: 3, title: 'Verify Facebook integrations Webhook', desc: 'Webhook seems to drop connection under peak payloads.', priority: 'High', status: 'Blocked', dueDate: '2026-05-22', assignee: 'Admin' },
    { id: 4, title: 'Update leads sheet for converted leads', desc: 'Need to import converted leads data to invoicing module.', priority: 'Low', status: 'Closed', dueDate: '2026-05-18', assignee: 'Support Member A' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', desc: '', priority: 'Medium', status: 'Open', dueDate: '', assignee: 'Support Member A' });

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    task.assignee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    
    setTasks([
      ...tasks,
      {
        id: tasks.length + 1,
        ...newTask
      }
    ]);
    setNewTask({ title: '', desc: '', priority: 'Medium', status: 'Open', dueDate: '', assignee: 'Support Member A' });
    setShowAddModal(false);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Open': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Blocked': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Closed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-450';
      case 'Medium': return 'text-amber-405';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks by title or assignee..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all w-full sm:w-auto justify-center shadow-lg shadow-indigo-600/10"
        >
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => (
          <div 
            key={task.id} 
            className="p-5 rounded-xl glass-panel border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wide uppercase ${getStatusStyle(task.status)}`}>
                  {task.status}
                </span>
                
                <span className={`text-[10px] font-bold ${
                  task.priority === 'High' ? 'text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10' : 'text-slate-400 bg-slate-500/5 px-2 py-0.5 rounded border border-slate-500/10'
                }`}>
                  {task.priority} Priority
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100 mb-1.5 line-clamp-1">{task.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{task.desc}</p>
            </div>

            <div className="pt-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <User size={12} className="text-indigo-400" />
                <span>{task.assignee}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-indigo-400" />
                <span>Due: {task.dueDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Create New Task</h3>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Task Title</label>
                <input 
                  type="text" 
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Call back Tasnim Rahman" 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Description</label>
                <textarea 
                  value={newTask.desc}
                  onChange={(e) => setNewTask({ ...newTask, desc: e.target.value })}
                  rows={3}
                  placeholder="Wants to discuss pricing plans..." 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Priority</label>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Status</label>
                  <select 
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Assignee</label>
                  <select 
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Support Member A">Support Member A</option>
                    <option value="Support Member B">Support Member B</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Due Date</label>
                  <input 
                    type="date" 
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/10"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
