import React, { useState } from "react";
import { AppState, User, Task } from "../types";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";
import { Setup } from "./Auth";
import {
  CheckCircle,
  Users,
  DollarSign,
  Wallet,
  AlertCircle,
  User as UserIcon,
  Plus,
  X,
  Trash2,
  Clock,
  Phone,
  CheckSquare,
} from "lucide-react";
import { generateId } from "../utils/id";

/* ---------------------------------------------------------
   HOME DASHBOARD  (Overview tab)
--------------------------------------------------------- */

interface HomeDashboardProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  onNavigate: (view: "tasks" | "family") => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentUser,
  users,
  tasks,
  onNavigate,
}) => {
  const isParent = currentUser.role === "parent";

  /* ---------------- Parent View ---------------- */
  if (isParent) {
    const children = users.filter((u) => u.role === "child");

    return (
      <div className="space-y-4">

        <div className="flex flex-col gap-1 mb-2">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            Family overview
          </h2>
          <p className="text-xs text-slate-400">
            Track balances and progress for all children.
            Use the top menu to manage tasks and family members.
          </p>
        </div>

        {children.length === 0 ? (
          <Card className="p-4 text-center text-xs text-slate-400">
            No children added yet.  
            Go to the <strong>Family</strong> tab to add your first child.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {children.map((child) => {
              const childTasks = tasks.filter(
                (t) => t.assignedToId === child.id
              );
              const pending = childTasks.filter(
                (t) => t.status === "pending"
              ).length;
              const waiting = childTasks.filter(
                (t) => t.status === "waiting_for_approval"
              ).length;
              const completed = childTasks.filter(
                (t) => t.status === "completed"
              ).length;

              return (
                <Card key={child.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center">
                      <span className="text-lg">{child.avatar || "👤"}</span>
                    </div>

                    <div className="flex flex-col">
                      <h3 className="text-sm font-semibold text-slate-100">
                        {child.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">Child</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-[12px] mb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-300 font-semibold">
                        {child.balance ?? 0} kr
                      </span>
                      <span className="text-slate-500">balance</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-sky-400" />
                      <span className="text-slate-300">
                        Earned{" "}
                        <span className="text-sky-300 font-semibold">
                          {child.totalEarned ?? 0} kr
                        </span>{" "}
                        total
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] mb-3">
                    <Card className="p-2 text-center bg-slate-900/40">
                      <div className="text-slate-400">Pending</div>
                      <div className="text-slate-100 font-semibold">{pending}</div>
                    </Card>
                    <Card className="p-2 text-center bg-slate-900/40">
                      <div className="text-slate-400">Waiting</div>
                      <div className="text-amber-300 font-semibold">{waiting}</div>
                    </Card>
                    <Card className="p-2 text-center bg-slate-900/40">
                      <div className="text-slate-400">Done</div>
                      <div className="text-emerald-300 font-semibold">{completed}</div>
                    </Card>
                  </div>

                  {/* Small links only */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => onNavigate("tasks")}
                      className="text-[11px] text-slate-400 hover:text-slate-100"
                    >
                      View tasks →
                    </button>
                    <button
                      onClick={() => onNavigate("family")}
                      className="text-[11px] text-slate-400 hover:text-slate-100"
                    >
                      Family →
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ---------------- Child View ---------------- */
  const myTasks = tasks.filter((t) => t.assignedToId === currentUser.id);
  const pending = myTasks.filter((t) => t.status === "pending").length;
  const waiting = myTasks.filter(
    (t) => t.status === "waiting_for_approval"
  ).length;
  const completed = myTasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-emerald-400" />
        Hi {currentUser.name}! This is your week.
      </h2>

      <p className="text-xs text-slate-400">
        Complete tasks and send them for approval to earn allowance.
      </p>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <Card className="p-3 text-center">
          <div className="text-slate-500">Pending</div>
          <div className="text-slate-100 font-semibold">{pending}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-slate-500">Waiting</div>
          <div className="text-amber-300 font-semibold">{waiting}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-slate-500">Done</div>
          <div className="text-emerald-300 font-semibold">{completed}</div>
        </Card>
      </div>

      <div className="text-[11px] text-slate-400">
        Use the <strong>Tasks</strong> tab to update your chores.
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   TASK MANAGER  (Tasks tab)
--------------------------------------------------------- */

interface TaskManagerProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  onStateChange: (update: Partial<AppState>) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  currentUser,
  users,
  tasks,
  onStateChange,
}) => {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    reward: 10,
    assignedToId: "",
  });

  const isParent = currentUser.role === "parent";

  const myTasks = isParent
    ? tasks
    : tasks.filter((t) => t.assignedToId === currentUser.id);

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.assignedToId) return;

    const newTask: Task = {
      id: generateId(),
      title: form.title,
      description: form.description || undefined,
      reward: form.reward,
      assignedToId: form.assignedToId,
      status: "pending",
      createdAt: Date.now(),
    };

    onStateChange({ tasks: [...tasks, newTask] });
    setCreating(false);
    setForm({ title: "", description: "", reward: 10, assignedToId: "" });
  };

  const onDelete = (id: string) => {
    if (!confirm("Delete this task?")) return;
    onStateChange({ tasks: tasks.filter((t) => t.id !== id) });
  };

  const childName = (task: Task) =>
    users.find((u) => u.id === task.assignedToId)?.name || "Unknown";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-emerald-400" />
          {isParent ? "Family Tasks" : "My Tasks"}
        </h2>
        <p className="text-xs text-slate-400">
          {isParent
            ? "Create and assign tasks. Approve finished tasks."
            : "Finish tasks and send for approval."}
        </p>
      </div>

      {/* Create task button */}
      {isParent && (
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New task
        </Button>
      )}

      {/* Create task modal */}
      {creating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur z-50 flex items-center justify-center">
          <Card className="p-4 w-full max-w-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">
                Create task
              </h3>
              <button
                onClick={() => setCreating(false)}
                className="p-1 text-slate-400 hover:text-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onCreate} className="space-y-3 mt-3">
              <div>
                <label className="text-[11px] text-slate-300">
                  Task title
                </label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300">
                    Reward (kr)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={form.reward}
                    onChange={(e) =>
                      setForm({ ...form, reward: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300">
                    Assign to
                  </label>
                  <select
                    value={form.assignedToId}
                    onChange={(e) =>
                      setForm({ ...form, assignedToId: e.target.value })
                    }
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                  >
                    <option value="">Select child...</option>
                    {users
                      .filter((u) => u.role === "child")
                      .map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit">
                  Create
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Task list */}
      <div className="grid gap-3">
        {myTasks.map((task) => (
          <Card key={task.id} className="p-3">

            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-100">
                    {task.title}
                  </h3>

                  <span className="px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 bg-slate-800 text-slate-300">
                    {task.status === "pending" && (
                      <>
                        <Clock className="h-3 w-3 text-sky-400" />
                        Pending
                      </>
                    )}
                    {task.status === "waiting_for_approval" && (
                      <>
                        <AlertCircle className="h-3 w-3 text-amber-400" />
                        Waiting
                      </>
                    )}
                    {task.status === "completed" && (
                      <>
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        Done
                      </>
                    )}
                  </span>
                </div>

                {task.description && (
                  <p className="text-[12px] text-slate-300 mb-2">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-400" />
                    {task.reward} kr
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3 text-slate-500" />
                    {childName(task)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2">

                {currentUser.role === "child" && task.status === "pending" && (
                  <Button
                    size="xs"
                    onClick={() => {
                      const updated = tasks.map((t) =>
                        t.id === task.id
                          ? { ...t, status: "waiting_for_approval" }
                          : t
                      );
                      onStateChange({ tasks: updated });
                    }}
                  >
                    Mark done
                  </Button>
                )}

                {currentUser.role === "parent" &&
                  task.status === "waiting_for_approval" && (
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => {
                          const updatedTasks = tasks.map((t) =>
                            t.id === task.id
                              ? { ...t, status: "completed" }
                              : t
                          );

                          const child = users.find(
                            (u) => u.id === task.assignedToId
                          );

                          if (child) {
                            const updatedUsers = users.map((u) =>
                              u.id === child.id
                                ? {
                                    ...u,
                                    balance:
                                      (u.balance ?? 0) + task.reward,
                                    totalEarned:
                                      (u.totalEarned ?? 0) + task.reward,
                                  }
                                : u
                            );

                            onStateChange({
                              tasks: updatedTasks,
                              users: updatedUsers,
                            });
                          }
                        }}
                      >
                        Approve
                      </Button>

                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          const updated = tasks.map((t) =>
                            t.id === task.id
                              ? { ...t, status: "pending" }
                              : t
                          );
                          onStateChange({ tasks: updated });
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                {currentUser.role === "parent" && (
                  <button
                    onClick={() => onDelete(task.id)}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   FAMILY MANAGER (Family tab)  
   (This section is unchanged from your old repo, aside from formatting cleanups)
--------------------------------------------------------- */

interface FamilyManagerProps {
  currentUser: User;
  users: User[];
  onStateChange: (update: Partial<AppState>) => void;
}

export const FamilyManager: React.FC<FamilyManagerProps> = ({
  currentUser,
  users,
  onStateChange,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const parents = users.filter((u) => u.role === "parent");
  const children = users.filter((u) => u.role === "child");

  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  const updateBalance = (userId: string, delta: number) => {
    const updated = users.map((u) =>
      u.id === userId
        ? { ...u, balance: Math.max(0, (u.balance ?? 0) + delta) }
        : u
    );
    onStateChange({ users: updated });
  };

  const payOut = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user || user.balance === 0) return;

    const updated = users.map((u) =>
      u.id === userId ? { ...u, balance: 0 } : u
    );

    onStateChange({ users: updated });
  };

  const removeUser = (userId: string) => {
    if (!confirm("Remove this family member?")) return;

    const updated = users.filter((u) => u.id !== userId);
    onStateChange({ users: updated });

    if (selectedUserId === userId) setSelectedUserId(null);
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
        <Users className="h-4 w-4 text-emerald-400" />
        Family
      </h2>
      <p className="text-xs text-slate-400">
        Manage balances and family members.
      </p>

      {/* Children list */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {children.map((child) => (
          <Card key={child.id} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <span className="text-sm">{child.avatar || "👤"}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    {child.name}
                  </div>
                  <div className="text-[11px] text-slate-400">Child</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserId(child.id)}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Details
              </button>
            </div>

            <div className="flex flex-col gap-1 text-[12px] mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-3 w-3 text-emerald-400" />
                <span className="font-semibold text-emerald-300">
                  {child.balance ?? 0} kr
                </span>
                <span className="text-slate-500">balance</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-3 w-3 text-sky-400" />
                <span>
                  Earned{" "}
                  <span className="font-semibold text-sky-300">
                    {child.totalEarned ?? 0} kr
                  </span>
                  {" "}total
                </span>
              </div>
              {child.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-slate-500" />
                  <span>{child.phoneNumber}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => updateBalance(child.id, 10)}
                >
                  +10
                </Button>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => updateBalance(child.id, 20)}
                >
                  +20
                </Button>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => updateBalance(child.id, -10)}
                >
                  -10
                </Button>
              </div>

              <Button
                size="xs"
                variant="primary"
                disabled={!child.balance}
                onClick={() => payOut(child.id)}
              >
                Pay out
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Parent list */}
      {parents.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 mb-2">
            Parents
          </h3>

          <div className="grid gap-2 sm:grid-cols-2">
            {parents.map((parent) => (
              <Card key={parent.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center">
                    <span className="text-sm">{parent.avatar || "👤"}</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      {parent.name}
                    </div>
                    <div className="text-[11px] text-slate-400">Parent</div>
                  </div>
                </div>

                <button
                  onClick={() => removeUser(parent.id)}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal for selected user */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur flex items-center justify-center z-50">
          <Card className="p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-emerald-400" />
                {selectedUser.name}
              </h3>

              <button
                onClick={() => setSelectedUserId(null)}
                className="p-1 text-slate-400 hover:text-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="flex items-center gap-2">
                <Wallet className="h-3 w-3 text-emerald-400" />
                <span className="font-semibold text-emerald-300">
                  {selectedUser.balance ?? 0} kr
                </span>
                <span className="text-slate-500">balance</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-3 w-3 text-sky-400" />
                <span>
                  Earned{" "}
                  <span className="text-sky-300 font-semibold">
                    {selectedUser.totalEarned ?? 0} kr
                  </span>
                  {" "}total
                </span>
              </div>

              {/* Balance adjust for children only */}
              {selectedUser.role === "child" && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">
                    Quick adjust
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => updateBalance(selectedUser.id, 10)}
                    >
                      +10 kr
                    </Button>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => updateBalance(selectedUser.id, 20)}
                    >
                      +20 kr
                    </Button>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => updateBalance(selectedUser.id, -10)}
                    >
                      -10 kr
                    </Button>
                  </div>

                  <div className="flex justify-end mt-2">
                    <Button
                      size="xs"
                      variant="primary"
                      disabled={!selectedUser.balance}
                      onClick={() => payOut(selectedUser.id)}
                    >
                      Pay out
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800 mt-3">
              <button
                onClick={() => removeUser(selectedUser.id)}
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>

              {selectedUser.phoneNumber && (
                <a
                  href={`tel:${selectedUser.phoneNumber}`}
                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  Call
                </a>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------
   RootView (used only in old build, kept for safety)
--------------------------------------------------------- */

export const RootView = () => {
  return (
    <div className="p-4 text-slate-300 text-sm">
      RootView is inactive. App uses Layout + HomeDashboard instead.
    </div>
  );
};
