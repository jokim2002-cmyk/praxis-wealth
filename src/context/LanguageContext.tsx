import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Language = "en" | "hi" | "gu";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "praxis_language";

const translations: Record<Language, Record<string, string>> = {
  en: {
    "language": "Language",
    "goals": "Goals",
    "bills": "Bills & Subs",
    "emergency_fund": "Emergency Fund",
    "no_goals": "No goals yet.",
    "create_goal_desc": "Create a savings bucket for a trip, a car, an investment, or working capital.",
    "app_name": "Praxis Wealth",
    "sign_in": "Sign In",
    "sign_up": "Sign Up",
    "email": "Email",
    "password": "Password",
    "name": "Name",
    "create_account": "Create Account",
    "already_have_account": "Already have an account?",
    "dont_have_account": "Don't have an account?",
    "sign_in_here": "Sign in here",
    "create_one": "Create one",
    "works_offline": "Works offline · Syncs when online",
    "net_worth": "NET WORTH",
    "safe_to_spend": "SAFE TO SPEND",
    "daily_safe_spend": "DAILY SAFE SPEND",
    "fixed_bills": "FIXED BILLS",
    "savings_target": "SAVINGS TARGET",
    "financial_health": "Financial Health",
    "cash_and_liquidity": "Cash & Liquidity",
    "bank": "Bank",
    "cash": "Cash",
    "emergency": "Emergency",
    "category_ledger": "Category ledger",
    "no_entries": "No entries this month yet.",
    "log_an_entry": "Log an entry",
    "this_month": "THIS MONTH",
    "good_day": "Good day",
    "the_ledger": "THE LEDGER",
    "entries": "Entries",
    "new_entry": "New entry",
    "amount": "Amount",
    "description": "Description",
    "category": "Category",
    "save_entry": "Save entry",
    "expense": "expense",
    "income": "income",
    "ai_auto": "AI auto",
    "the_plan": "THE PLAN",
    "look_ahead": "Look ahead.",
    "new_goal": "New goal",
    "new_bill": "New bill",
    "add_goal": "Add Goal",
    "add_bill": "Add Bill",
    "the_tax_ledger": "THE TAX LEDGER",
    "projected_liability": "Projected FY liability.",
    "annual_income": "ANNUAL INCOME",
    "projected_tax": "PROJECTED TAX",
    "effective_rate": "EFFECTIVE RATE",
    "section_80c": "Section 80C",
    "old_regime": "OLD",
    "new_regime": "NEW",
    "advance_tax": "Advance Tax",
    "personal_ca": "PERSONAL CA",
    "in_session": "In session.",
    "ask_your_ca": "Ask your CA…",
    "how_may_i_assist": "How may I assist you today?",
    "ca_description": "I have your monthly ledger in front of me. Ask me anything — tax, savings, cash, investing.",
    "ca_reviewing": "CA is reviewing your ledger…",
    "praxis_ca": "PRAXIS CA",
    "i_couldnt_reach": "I couldn't reach the ledger just now.",
  },
  hi: {
    "language": "भाषा",
    "goals": "लक्ष्य",
    "bills": "बिल और सब्सक्रिप्शन",
    "emergency_fund": "आपातकालीन निधि",
    "no_goals": "अभी कोई लक्ष्य नहीं।",
    "create_goal_desc": "यात्रा, कार, निवेश, या कार्यशील पूंजी के लिए बचत बाल्टी बनाएं।",
    "app_name": "प्रैक्सिस वेल्थ",
    "sign_in": "साइन इन करें",
    "sign_up": "साइन अप करें",
    "email": "ईमेल",
    "password": "पासवर्ड",
    "name": "नाम",
    "create_account": "खाता बनाएं",
    "already_have_account": "पहले से खाता है?",
    "dont_have_account": "खाता नहीं है?",
    "sign_in_here": "यहां साइन इन करें",
    "create_one": "नया बनाएं",
    "works_offline": "ऑफलाइन काम करता है · ऑनलाइन सिंक करता है",
    "net_worth": "कुल संपत्ति",
    "safe_to_spend": "खर्च करने योग्य",
    "daily_safe_spend": "दैनिक सुरक्षित खर्च",
    "fixed_bills": "नियमित बिल",
    "savings_target": "बचत लक्ष्य",
    "financial_health": "वित्तीय स्वास्थ्य",
    "cash_and_liquidity": "नकद और तरलता",
    "bank": "बैंक",
    "cash": "नकद",
    "emergency": "आपातकालीन",
    "category_ledger": "श्रेणी खाता",
    "no_entries": "इस महीने कोई प्रविष्टि नहीं।",
    "log_an_entry": "प्रविष्टि दर्ज करें",
    "this_month": "इस महीने",
    "good_day": "नमस्ते",
    "the_ledger": "लेज़र",
    "entries": "प्रविष्टियाँ",
    "new_entry": "नई प्रविष्टि",
    "amount": "राशि",
    "description": "विवरण",
    "category": "श्रेणी",
    "save_entry": "प्रविष्टि सहेजें",
    "expense": "खर्च",
    "income": "आय",
    "ai_auto": "एआई स्वत",
    "the_plan": "योजना",
    "look_ahead": "आगे देखें।",
    "new_goal": "नया लक्ष्य",
    "new_bill": "नया बिल",
    "add_goal": "लक्ष्य जोड़ें",
    "add_bill": "बिल जोड़ें",
    "the_tax_ledger": "टैक्स लेज़र",
    "projected_liability": "अनुमानित वार्षिक देनदारी।",
    "annual_income": "वार्षिक आय",
    "projected_tax": "अनुमानित टैक्स",
    "effective_rate": "प्रभावी दर",
    "section_80c": "धारा 80C",
    "old_regime": "पुरानी व्यवस्था",
    "new_regime": "नई व्यवस्था",
    "advance_tax": "अग्रिम टैक्स",
    "personal_ca": "व्यक्तिगत सीए",
    "in_session": "सत्र में।",
    "ask_your_ca": "अपने सीए से पूछें…",
    "how_may_i_assist": "आज मैं आपकी कैसे सहायता कर सकता हूँ?",
    "ca_description": "आपका मासिक लेज़र मेरे सामने है। टैक्स, बचत, नकदी, निवेश – कुछ भी पूछें।",
    "ca_reviewing": "सीए आपके लेज़र की समीक्षा कर रहा है…",
    "praxis_ca": "प्रैक्सिस सीए",
    "i_couldnt_reach": "मैं अभी लेज़र तक नहीं पहुँच पाया।",
  },
  gu: {
    "language": "ભાષા",
    "goals": "લક્ષ્યો",
    "bills": "બિલ અને સબ્સ્ક્રિપ્શન",
    "emergency_fund": "કટોકટી ભંડોળ",
    "no_goals": "હજી કોઈ લક્ષ્ય નથી.",
    "create_goal_desc": "સફર, કાર, રોકાણ, અથવા કાર્યકારી મૂડી માટે બચત ડોલ બનાવો.",
    "app_name": "પ્રેક્સિસ વેલ્થ",
    "sign_in": "સાઇન ઇન કરો",
    "sign_up": "સાઇન અપ કરો",
    "email": "ઇમેઇલ",
    "password": "પાસવર્ડ",
    "name": "નામ",
    "create_account": "ખાતું બનાવો",
    "already_have_account": "પહેલેથી ખાતું છે?",
    "dont_have_account": "ખાતું નથી?",
    "sign_in_here": "અહીં સાઇન ઇન કરો",
    "create_one": "નવું બનાવો",
    "works_offline": "ઑફલાઇન કામ કરે છે · ઑનલાઇન સિંક કરે છે",
    "net_worth": "કુલ સંપત્તિ",
    "safe_to_spend": "ખર્ચ કરી શકાય એટલું",
    "daily_safe_spend": "દૈનિક સલામત ખર્ચ",
    "fixed_bills": "નિયમિત બિલ",
    "savings_target": "બચત લક્ષ્ય",
    "financial_health": "નાણાકીય સ્વાસ્થ્ય",
    "cash_and_liquidity": "રોકડ અને તરલતા",
    "bank": "બેંક",
    "cash": "રોકડ",
    "emergency": "કટોકટી",
    "category_ledger": "શ્રેણી ખાતું",
    "no_entries": "આ મહિને કોઈ પ્રવિષ્ટિ નથી.",
    "log_an_entry": "પ્રવિષ્ટિ દાખલ કરો",
    "this_month": "આ મહિને",
    "good_day": "નમસ્તે",
    "the_ledger": "લેઝર",
    "entries": "પ્રવિષ્ટિઓ",
    "new_entry": "નવી પ્રવિષ્ટિ",
    "amount": "રકમ",
    "description": "વર્ણન",
    "category": "શ્રેણી",
    "save_entry": "પ્રવિષ્ટિ સાચવો",
    "expense": "ખર્ચ",
    "income": "આવક",
    "ai_auto": "એઆઈ ઓટો",
    "the_plan": "યોજના",
    "look_ahead": "આગળ જુઓ.",
    "new_goal": "નવું લક્ષ્ય",
    "new_bill": "નવું બિલ",
    "add_goal": "લક્ષ્ય ઉમેરો",
    "add_bill": "બિલ ઉમેરો",
    "the_tax_ledger": "ટેક્સ લેઝર",
    "projected_liability": "અંદાજિત વાર્ષિક જવાબદારી.",
    "annual_income": "વાર્ષિક આવક",
    "projected_tax": "અંદાજિત ટેક્સ",
    "effective_rate": "અસરકારક દર",
    "section_80c": "કલમ 80C",
    "old_regime": "જૂની વ્યવસ્થા",
    "new_regime": "નવી વ્યવસ્થા",
    "advance_tax": "એડવાન્સ ટેક્સ",
    "personal_ca": "વ્યક્તિગત સીએ",
    "in_session": "સત્રમાં.",
    "ask_your_ca": "તમારા સીએને પૂછો…",
    "how_may_i_assist": "આજે હું તમારી કેવી મદદ કરી શકું?",
    "ca_description": "તમારું માસિક લેઝર મારી સામે છે. ટેક્સ, બચત, રોકડ, રોકાણ – કંઈ પણ પૂછો.",
    "ca_reviewing": "સીએ તમારા લેઝરની સમીક્ષા કરી રહ્યો છે…",
    "praxis_ca": "પ્રેક્સિસ સીએ",
    "i_couldnt_reach": "હું હમણાં લેઝર સુધી પહોંચી શક્યો નથી.",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "hi" || saved === "gu") {
        setLanguage(saved);
      } else {
        setLanguage("en");
      }
    } catch (e) {
      console.warn("Failed to load language:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetLanguage = async (lang: Language) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn("Failed to save language:", e);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  if (isLoading) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
