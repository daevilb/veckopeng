import React, { useState } from "react";
import { User, Role, PaymentMethod, Currency } from "../types";
import { Button } from "./Button";
import { Input } from "./Input";
import { Card } from "./Card";
import { UserPlus, Lock, ChevronLeft, Check } from "lucide-react";
import { createUserApi } from "../services/api"; // Import the API

interface SetupProps {
  // Fixed: onComplete now returns the full User (with ID) again
  onComplete: (user: User) => void;
  isFirstRun: boolean;
}

export const Setup: React.FC<SetupProps> = ({ onComplete, isFirstRun }) => {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>(isFirstRun ? "parent" : "child");
  const [avatar, setAvatar] = useState("👤");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("swish");
  const [currency, setCurrency] = useState<Currency>("SEK");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatars = [
    "👨‍👩‍👧",
    "🦸‍♂️",
    "🦸‍♀️",
    "🧚",
    "🧞",
    "🦊",
    "🦄",
    "🦖",
    "⚽️",
    "🎨",
    "🎮",
    "🎸",
    "🤖",
    "🦁",
    "🐵",
    "🐼",
  ];

  const paymentLabel =
    paymentMethod === "swish"
      ? "Phone Number (for Swish)"
      : paymentMethod === "venmo"
      ? "Venmo username"
      : "Cash App $Cashtag";

  const paymentPlaceholder =
    paymentMethod === "swish"
      ? "070..."
      : paymentMethod === "venmo"
      ? "@username"
      : "$cashtag";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return alert("PIN must be 4 digits");

    setIsSubmitting(true);

    const newUserPayload = {
      name,
      role,
      pin,
      avatar,
      phoneNumber: phone,
      paymentMethod,
      currency,
      balance: 0,
      totalEarned: 0,
    };

    try {
      // Create user in DB first to get the ID
      const createdUser = await createUserApi(newUserPayload);
      // Pass the full user (with ID) to the parent
      onComplete(createdUser);
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6">
      <div className="w-full max-w-md">
        <Card className="relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              {!isFirstRun && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-500 text-white text-sm">
                    <UserPlus className="w-4 h-4" />
                  </span>

                  {isFirstRun ? "Welcome to Veckopeng" : "Add Family Member"}
                </h2>

                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {isFirstRun
                    ? "Set up the first parent account to get started."
                    : "Add a new member to your family."}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Name */}
              <Input
                // CHANGED: clarify first-time setup is for parent only
                label={isFirstRun ? "Parent name" : "Name"}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isFirstRun ? "Parent name" : "Parent or child name"}
              />

              {/* PIN */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 ml-1">
                  4-digit PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    pattern="\d{4}"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-gray-900 dark:text-white text-center font-mono tracking-[0.5em] text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    required
                  />
                </div>
              </div>

              {/* Role selection */}
              {!isFirstRun && (
                <div className="mt-5 mb-5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 ml-1">
                    Role
                  </label>

                  <div className="flex gap-4">
                    {/* Parent */}
                    <label
                      className={`flex-1 p-4 rounded-xl border text-center cursor-pointer transition-all ${
                        role === "parent"
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        checked={role === "parent"}
                        onChange={() => setRole("parent")}
                      />
                      <div className="text-center font-semibold text-gray-900 dark:text-white">
                        Parent
                      </div>
                    </label>

                    {/* Child */}
                    <label
                      className={`flex-1 p-4 rounded-xl border text-center cursor-pointer transition-all ${
                        role === "child"
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-200 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        checked={role === "child"}
                        onChange={() => setRole("child")}
                      />
                      <div className="text-center font-semibold text-gray-900 dark:text-white">
                        Child
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Avatar Picker */}
              <div className="mb-5 mt-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 ml-1">
                  Choose Avatar
                </label>

                <div className="grid grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                  {avatars.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`text-3xl h-12 w-full flex items-center justify-center rounded-xl border transition-all ${
                        avatar === a
                          ? "bg-white dark:bg-gray-700 shadow-md ring-2 ring-primary-500 scale-110"
                          : "opacity-70 hover:opacity-100 border-transparent"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Settings (CHILD ONLY) */}
              {role === "child" && (
                <>
                  {/* Payment Method */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 ml-1">
                      Payment Method
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "swish", label: "Swish" },
                        { id: "venmo", label: "Venmo" },
                        { id: "cashapp", label: "Cash App" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setPaymentMethod(m.id as PaymentMethod)
                          }
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            paymentMethod === m.id
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Currency */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 ml-1">
                      Currency
                    </label>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrency("SEK")}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          currency === "SEK"
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        SEK (kr)
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrency("USD")}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          currency === "USD"
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>

                  {/* Payment handle */}
                  <div className="mb-6">
                    <Input
                      label={paymentLabel}
                      required
                      type={paymentMethod === "swish" ? "tel" : "text"}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={paymentPlaceholder}
                    />

                    <p className="text-xs text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg mt-2">
                      Required so parents can pay allowance.
                    </p>
                  </div>
                </>
              )}

              <Button
                type="submit"
                fullWidth
                size="lg"
                className="mt-4"
                disabled={isSubmitting}
              >
                <UserPlus className="w-5 h-5" />
                {isSubmitting
                  ? "Creating Account..."
                  : isFirstRun
                  ? "Start App"
                  : "Create Account"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin === selectedUser.pin) {
      onLogin(selectedUser);
    } else {
      setError("Incorrect PIN");
      setPin("");
      setTimeout(() => setError(""), 2000);
    }
  };

  if (selectedUser) {
    return (
      <div className="w-full max-w-sm mx-auto animate-in zoom-in-95 duration-300">
        <Card className="text-center pt-10 pb-10 relative overflow-hidden">
          <button
            onClick={() => {
              setSelectedUser(null);
              setPin("");
            }}
            className="absolute left-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center gap-3">
            <div className="text-6xl mb-4">{selectedUser.avatar}</div>

            <div className="font-bold text-xl text-gray-900 dark:text-white">
              {selectedUser.name}
            </div>

            <form
              onSubmit={handlePinSubmit}
              className="w-full max-w-xs mx-auto mt-4"
            >
              <Input
                label="Enter PIN"
                type="password"
                maxLength={4}
                pattern="\d{4}"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, ""))
                }
                className="text-center tracking-[0.5em] text-lg"
              />

              {error && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
              )}

              <Button type="submit" fullWidth size="lg" className="mt-4">
                <Check className="w-5 h-5" />
                Continue
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-6">
      <div className="w-full max-w-md">
        <Card className="relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-500 text-white text-sm">
                <UserPlus className="w-4 h-4" />
              </span>
              Who's managing chores today?
            </h2>

            <p className="text-gray-500 dark:text-gray-400 mb-5">
              Tap your profile to log in using your PIN.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all"
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="text-6xl mb-4 transform transition-transform group-hover:scale-110 duration-300">
                    {user.avatar}
                  </div>

                  <div className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-primary-400 transition-colors">
                    {user.name}
                  </div>

                  <span
                    className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === "parent"
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                        : "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};