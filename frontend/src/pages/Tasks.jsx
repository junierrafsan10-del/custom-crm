import { useState, useEffect } from 'react';
import { get, post, del } from '../utils/api';
import {
  Plus,
  Search,
  User,
  Calendar,
  Trash2
} from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', desc: '', priority: 'Medium', status: 'Open', dueDate: '', assignee: 'Support Member A' });

  useEffect(() => {
    get('/api/tasks')
      .then(data => {
        if (data.success && data.data) {
          const mapped = data.data.map(t => ({ ...t, id: t._id }));
          setTasks(mapped);
        }
      })
      .catch(err => console.error('Error fetching tasks:', err));
  }, []);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    post('/api/tasks', newTask)
      .then(data => {
        if (data.success && data.data) {
          setTasks([{ ...data.data, id: data.data._id }, ...tasks]);
        }
        setNewTask({ title: '', desc: '', priority: 'Medium', status: 'Open', dueDate: '', assignee: 'Support Member A' });
        setShowAddModal(false);
      })
      .catch(err => console.error('Error creating task:', err));
  };

  const handleDeleteTask = (taskId) => {
    del('/api/tasks/' + taskId)
      .then(() => {
        setTasks(tasks.filter(t => t.id !== taskId));
      })
      .catch(err => console.error('Error deleting task:', err));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Open': return 'bg-primary/10 text-primary border-primary/20';
      case 'In Progress': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Blocked': return 'bg-error/10 text-error border-error/20';
      case 'Closed': return 'bg-on-surface-variant/10 text-on-surface-variant border-outline-variant/20';
      default: return 'bg-surface-container-high text-on-surface-variant border-outline-variant/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/20">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-on-surface-variant" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks by title or assignee..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary hover:bg-primary-fixed text-xs font-semibold rounded-lg transition-all w-full sm:w-auto justify-center shadow-lg shadow-primary/10"
        >
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="p-5 rounded-xl glass-panel border border-outline-variant/20 hover:border-outline transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wide uppercase ${getStatusStyle(task.status)}`}>
                  {task.status}
                </span>
                
                <span className={`text-[10px] font-bold ${
                  task.priority === 'High' ? 'text-error bg-error/5 px-2 py-0.5 rounded border border-error/10' : 'text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/10'
                }`}>
                  {task.priority} Priority
                </span>
              </div>

              <h3 className="text-sm font-bold text-on-surface mb-1.5 line-clamp-1">{task.title}</h3>
              <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4">{task.desc}</p>
            </div>

            <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <div className="flex items-center gap-1.5">
                <User size={12} className="text-primary" />
                <span>{task.assignee}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-primary" />
                  <span>Due: {task.dueDate}</span>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded bg-surface-container-high hover:bg-error/20 text-on-surface-variant hover:text-error transition-all"
                  title="Delete task"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border border-outline-variant/20 rounded-xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-on-surface mb-4">Create New Task</h3>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-[10px] text-on-surface-variant font-semibold mb-1 uppercase">Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Call back Tasnim Rahman"
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-on-surface-variant font-semibold mb-1 uppercase">Description</label>
                <textarea
                  value={newTask.desc}
                  onChange={(e) => setNewTask({ ...newTask, desc: e.target.value })}
                  rows={3}
                  placeholder="Wants to discuss pricing plans..."
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-on-surface-variant font-semibold mb-1 uppercase">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-on-surface-variant font-semibold mb-1 uppercase">Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none"
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
                  <label className="block text-[10px] text-on-surface-variant font-semibold mb-1 uppercase">Assignee</label>
                  <select
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none"
                  >
                    <option value="Support Member A">Support Member A</option>
                    <option value="Support Member B">Support Member B</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-on-surface-variant font-semibold mb-1 uppercase">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/20 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-surface-container-high text-on-surface-variant text-xs font-semibold rounded-lg hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-primary-fixed transition-colors shadow-lg shadow-primary/10"
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
