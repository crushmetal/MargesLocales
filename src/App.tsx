import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, MapPin, Building2, Users, AlertTriangle, 
  CheckCircle, Save, Database, Plus, Trash2, Lock, Unlock, 
  X, Calculator, ChevronUp, CheckSquare, Square, 
  Landmark, BadgeCheck, MapPinned, Target, CloudDownload, FileText, Edit3
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, User 
} from 'firebase/auth';

/**
 * ==========================================
 * 1. CONFIGURATION & DONNÉES DE MASSE
 * ==========================================
 */

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDOBFXdCfEH0IJ_OsIH7rHijYT_NEY1FGA",
  authDomain: "marges-locales59.firebaseapp.com",
  projectId: "marges-locales59",
  storageBucket: "marges-locales59.firebasestorage.app",
  messagingSenderId: "1077584427724",
  appId: "1:1077584427724:web:39e529e17d4021110e6069"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = 'nord-habitat-v1'; 
const PUBLIC_DATA_PATH = ['artifacts', APP_ID, 'public', 'data', 'communes'];
const REFS_DATA_PATH = ['artifacts', APP_ID, 'public', 'data', 'references'];

// --- DONNÉES DE DÉMARRAGE (SEED) ---
const FULL_DB_59 = [
  // --- DT FLANDRE GRAND LITTORAL ---
  { insee: "59183", name: "Dunkerque", epci: "CU de Dunkerque", population: 86788, dt: "Flandre Grand Littoral", zA: "B2", zL: "2", sru: 35.0, cible: 25 },
  { insee: "59271", name: "Grande-Synthe", epci: "CU de Dunkerque", population: 20331, dt: "Flandre Grand Littoral", zA: "B2", zL: "2", sru: 60.0, cible: 25 },
  { insee: "59155", name: "Coudekerque-Branche", epci: "CU de Dunkerque", population: 20765, dt: "Flandre Grand Littoral", zA: "B2", zL: "2", sru: 30.0, cible: 25 },
  { insee: "59273", name: "Gravelines", epci: "CU de Dunkerque", population: 11223, dt: "Flandre Grand Littoral", zA: "B2", zL: "2", sru: 28.0, cible: 20 },
  { insee: "59123", name: "Bray-Dunes", epci: "CU de Dunkerque", population: 4380, dt: "Flandre Grand Littoral", zA: "B2", zL: "2", sru: 12.5, cible: 25 },
  { insee: "59668", name: "Zuydcoote", epci: "CU de Dunkerque", population: 1600, dt: "Flandre Grand Littoral", zA: "B2", zL: "2", sru: 8.0, cible: 25 },
  { insee: "59360", name: "Loon-Plage", epci: "CU de Dunkerque", population: 6039, dt: "Flandre Grand Littoral", zA: "B2", zL: "2", sru: 25.0, cible: 25 },
  { insee: "59588", name: "Téteghem-Coudekerque-Village", epci: "CU de Dunkerque", population: 8384, dt: "Flandre Grand Littoral", zA: "B2", zL: "2", sru: 24.89, cible: 25 },
  { insee: "59341", name: "Leffrinckoucke", epci: "CU de Dunkerque", population: 4124, dt: "Flandre Grand Littoral", zA: "B2", zL: "2", sru: 25.0, cible: 25 },
  { insee: "59098", name: "Bourbourg", epci: "CU de Dunkerque", population: 7023, dt: "Flandre Grand Littoral", zA: "C", zL: "3", sru: 25.0, cible: 20 },
  { insee: "59295", name: "Hazebrouck", epci: "CC Flandre Intérieure", population: 21498, dt: "Flandre Grand Littoral", zA: "C", zL: "3", sru: 22.98, cible: 20 },
  { insee: "59044", name: "Bailleul", epci: "CC Cœur de Flandre", population: 14869, dt: "Flandre Grand Littoral", zA: "B1", zL: "2", sru: 21.09, cible: 20 },
  { insee: "59437", name: "Nieppe", epci: "CC Cœur de Flandre", population: 7606, dt: "Flandre Grand Littoral", zA: "B1", zL: "2", sru: 23.07, cible: 20 },
  { insee: "59398", name: "Merville", epci: "CC Flandre Lys", population: 9652, dt: "Flandre Grand Littoral", zA: "C", zL: "3", sru: 17.56, cible: 20 },
  { insee: "59580", name: "Steenvoorde", epci: "CC Cœur de Flandre", population: 4324, dt: "Flandre Grand Littoral", zA: "C", zL: "3", sru: 9.72, cible: 20 },

  // --- DT MÉTROPOLE (MEL) ---
  { insee: "59350", name: "Lille", epci: "Métropole Européenne de Lille", population: 236710, dt: "DDTM Métropole", zA: "A", zL: "1", sru: 24.5, cible: 25 },
  { insee: "59512", name: "Roubaix", epci: "Métropole Européenne de Lille", population: 98892, dt: "DDTM Métropole", zA: "B1", zL: "1", sru: 45.2, cible: 25 },
  { insee: "59599", name: "Tourcoing", epci: "Métropole Européenne de Lille", population: 99011, dt: "DDTM Métropole", zA: "B1", zL: "1", sru: 32.1, cible: 25 },
  { insee: "59648", name: "Villeneuve-d'Ascq", epci: "Métropole Européenne de Lille", population: 62067, dt: "DDTM Métropole", zA: "B1", zL: "1", sru: 42.0, cible: 25 },
  { insee: "59368", name: "Marcq-en-Barœul", epci: "Métropole Européenne de Lille", population: 39356, dt: "DDTM Métropole", zA: "A", zL: "1", sru: 19.4, cible: 25 },
  { insee: "59328", name: "Lambersart", epci: "Métropole Européenne de Lille", population: 27121, dt: "DDTM Métropole", zA: "A", zL: "1", sru: 17.7, cible: 25 },
  { insee: "59017", name: "Armentières", epci: "Métropole Européenne de Lille", population: 25581, dt: "DDTM Métropole", zA: "B1", zL: "2", sru: 24.6, cible: 25 },
  { insee: "59343", name: "Lesquin", epci: "Métropole Européenne de Lille", population: 9241, dt: "DDTM Métropole", zA: "A", zL: "1", sru: 23.64, cible: 25 },
  { insee: "59090", name: "Bondues", epci: "Métropole Européenne de Lille", population: 9713, dt: "DDTM Métropole", zA: "A", zL: "1", sru: 18.6, cible: 25 },
  { insee: "59419", name: "Mouvaux", epci: "Métropole Européenne de Lille", population: 13173, dt: "DDTM Métropole", zA: "A", zL: "1", sru: 15.5, cible: 25 },
  { insee: "59378", name: "Marquette-lez-Lille", epci: "Métropole Européenne de Lille", population: 11213, dt: "DDTM Métropole", zA: "A", zL: "1", sru: 30.2, cible: 25 },
  { insee: "59320", name: "La Madeleine", epci: "Métropole Européenne de Lille", population: 22488, dt: "DDTM Métropole", zA: "A", zL: "1", sru: 25.2, cible: 25 },
  { insee: "59410", name: "Mons-en-Barœul", epci: "Métropole Européenne de Lille", population: 21467, dt: "DDTM Métropole", zA: "B1", zL: "1", sru: 30.0, cible: 25 },
  { insee: "59508", name: "Ronchin", epci: "Métropole Européenne de Lille", population: 19437, dt: "DDTM Métropole", zA: "A", zL: "1", sru: 28.9, cible: 25 },
  { insee: "59650", name: "Wattrelos", epci: "Métropole Européenne de Lille", population: 40836, dt: "DDTM Métropole", zA: "B1", zL: "1", sru: 25.0, cible: 25 },
  { insee: "59560", name: "Seclin", epci: "Métropole Européenne de Lille", population: 12834, dt: "DDTM Métropole", zA: "B1", zL: "1", sru: 25.0, cible: 25 },
  { insee: "59279", name: "Halluin", epci: "Métropole Européenne de Lille", population: 20829, dt: "DDTM Métropole", zA: "B1", zL: "2", sru: 27.0, cible: 25 },
  { insee: "59286", name: "Haubourdin", epci: "Métropole Européenne de Lille", population: 14757, dt: "DDTM Métropole", zA: "B1", zL: "2", sru: 25.0, cible: 25 },
  { insee: "59163", name: "Croix", epci: "Métropole Européenne de Lille", population: 20778, dt: "DDTM Métropole", zA: "A", zL: "1", sru: 22.25, cible: 25 },
  
  // --- DT HAINAUT - DOUAISIS - CAMBRÉSIS ---
  // Porte du Hainaut (CAPH)
  { insee: "59526", name: "Saint-Amand-les-Eaux", epci: "CA de la Porte du Hainaut", population: 15980, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.5, cible: 20 },
  { insee: "59172", name: "Denain", epci: "CA de la Porte du Hainaut", population: 20640, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 38.0, cible: 20 },
  { insee: "59092", name: "Bouchain", epci: "CA de la Porte du Hainaut", population: 3996, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 20.65, cible: 20 },
  { insee: "59181", name: "Douchy-les-Mines", epci: "CA de la Porte du Hainaut", population: 10207, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59490", name: "Raismes", epci: "CA de la Porte du Hainaut", population: 12055, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59001", name: "Abscon", epci: "CA de la Porte du Hainaut", population: 4203, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  
  // Valenciennes Métropole (CAVM)
  { insee: "59606", name: "Valenciennes", epci: "CA Valenciennes Métropole", population: 42991, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 28.0, cible: 20 },
  { insee: "59014", name: "Anzin", epci: "CA Valenciennes Métropole", population: 13422, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 35.0, cible: 20 },
  { insee: "59550", name: "Saint-Saulve", epci: "CA Valenciennes Métropole", population: 11117, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59372", name: "Marly", epci: "CA Valenciennes Métropole", population: 12024, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59032", name: "Aulnoy-lez-Valenciennes", epci: "CA Valenciennes Métropole", population: 7183, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59079", name: "Beuvrages", epci: "CA Valenciennes Métropole", population: 6784, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59139", name: "Bruay-sur-l'Escaut", epci: "CA Valenciennes Métropole", population: 11309, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59153", name: "Condé-sur-l'Escaut", epci: "CA Valenciennes Métropole", population: 9396, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59160", name: "Crespin", epci: "CA Valenciennes Métropole", population: 4515, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59253", name: "Fresnes-sur-Escaut", epci: "CA Valenciennes Métropole", population: 7486, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59458", name: "Petite-Forêt", epci: "CA Valenciennes Métropole", population: 5058, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 22.89, cible: 20 },
  
  // Douaisis
  { insee: "59173", name: "Douai", epci: "Douaisis Agglo", population: 39648, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 32.0, cible: 20 },
  { insee: "59569", name: "Sin-le-Noble", epci: "Douaisis Agglo", population: 15603, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 35.0, cible: 20 },
  { insee: "59632", name: "Waziers", epci: "Douaisis Agglo", population: 7354, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 35.0, cible: 20 },
  { insee: "59163", name: "Cuincy", epci: "Douaisis Agglo", population: 6472, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59170", name: "Dechy", epci: "Douaisis Agglo", population: 5351, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  
  // Cambrésis & Sambre
  { insee: "59122", name: "Cambrai", epci: "CA de Cambrai", population: 31425, dt: "Hainaut - Douaisis - Cambrésis", zA: "C", zL: "3", sru: 22.0, cible: 20 },
  { insee: "59392", name: "Maubeuge", epci: "CA Maubeuge Val de Sambre", population: 29066, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 40.0, cible: 20 },
  { insee: "59321", name: "Jeumont", epci: "CA Maubeuge Val de Sambre", population: 10342, dt: "Hainaut - Douaisis - Cambrésis", zA: "C", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59033", name: "Aulnoye-Aymeries", epci: "CA Maubeuge Val de Sambre", population: 8756, dt: "Hainaut - Douaisis - Cambrésis", zA: "C", zL: "2", sru: 35.0, cible: 20 },
  { insee: "59574", name: "Somain", epci: "CC Cœur d'Ostrevent", population: 11790, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 },
  { insee: "59008", name: "Aniche", epci: "CC Cœur d'Ostrevent", population: 9997, dt: "Hainaut - Douaisis - Cambrésis", zA: "B2", zL: "2", sru: 25.0, cible: 20 }
];

// --- DONNÉES RÉFÉRENTIELS (RÈGLES) ---

// 1. DDTM (Défaut)
const DDTM_DEF = {
    id: 'ddtm', name: 'DDTM 59 (Droit Commun)', lastUpdated: '01/01/2024',
    subsidiesState: [{ type: "PLAI", amount: "13 500 €", condition: "/lgt" }, { type: "PLUS", amount: "5 400 €", condition: "/lgt" }],
    subsidiesCD: [{ type: "CD PLAI", amount: "4 000 €", condition: "Forfait" }, { type: "CD PLUS", amount: "2 000 €", condition: "Forfait" }],
    subsidiesNPNRU: [{ type: "ANRU", amount: "Variable", condition: "Selon conv." }],
    marginsRE2020: [{ type: "Marge", product: "Tous", margin: "Selon perf" }],
    marginsDivers: [{ type: "Marge", product: "Tous", margin: "Selon perf" }],
    accessoryRents: [{ type: "Garage", product: "Annexes", maxRent: "60 €", condition: "Zone B1/B2" }],
    footnotes: ["Document de référence interne."],
    hasMargins: true, hasRents: true
};

// 2. MEL
const MEL_DEF = {
    ...DDTM_DEF, id: 'mel', name: 'Métropole Européenne de Lille', lastUpdated: 'Juillet 2025',
    subsidiesState: [
        { type: "PLAI DC / AA", amount: "9 130 €", condition: "Cumulable Bonus" },
        { type: "PLAI Adapté (Ord)", amount: "16 480 €", condition: "1-3 lgts" },
        { type: "PLAI Adapté (Str)", amount: "8 980 €", condition: "Structure" },
        { type: "PLAI - AA", amount: "16 000 €", condition: "Super Bonus" },
        { type: "PLUS - AA", amount: "20 000 €", condition: "Mega Bonus*" },
        { type: "Résidences Sociales", amount: "7 500 €", condition: "Suppl. Adapté" },
        { type: "PLAI Octave", amount: "9 130 €", condition: "Non cumul Etat" },
        { type: "PLAI Gens Voyage", amount: "9 130 €", condition: "Non cumul Etat" }
    ],
    subsidiesEPCI: [
        { type: "PLAI", amount: "15 000 €", condition: "/lgt" },
        { type: "PLAI (<10 lgts)", amount: "26 000 €", condition: "Opé < 10 lgts" },
        { type: "PLAI AA", amount: "26 000 €", condition: "/lgt" },
        { type: "PLAI Struct <50", amount: "15 000 €", condition: "/lgt" },
        { type: "PLAI Struct >50", amount: "12 000 €", condition: "/lgt" },
        { type: "PLAI Octave", amount: "7 500 €", condition: "Cumul Etat" },
        { type: "PLAI Octave CARSAT", amount: "+ 3 500 €", condition: "Bonus" },
        { type: "PLAI Gens Voyage", amount: "15K-30K €", condition: "/lgt" },
        { type: "PLAI Adapté", amount: "16 480 €", condition: "Cumulable" },
        { type: "PLAI Adapté Octave", amount: "8 980 €", condition: "Uniq. Octave" }
    ],
    subsidiesNPNRU: [
        { type: "Subv. PLAI", amount: "6 300+1 500", condition: "Doublé si AA" },
        { type: "Prêt PLAI", amount: "7 900+1 900", condition: "Doublé si AA" },
        { type: "Prêt PLUS", amount: "6 700+5 600", condition: "Doublé si AA" }
    ],
    subsidiesCD: [
        { type: "CD PLAI", amount: "27 000 €", condition: "Forfait" },
        { type: "CD PLAI Adapté", amount: "33 250 €", condition: "Ttes zones" },
        { type: "CD PLUS", amount: "18 000 €", condition: "Forfait" },
        { type: "CD PLS", amount: "4 000 €", condition: "Forfait" }
    ],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "0%" },
        { type: "Bbio -10%", product: "PLUS", margin: "0%" },
        { type: "Bbio -20%", product: "PLUS", margin: "0%" },
        { type: "Cepnr -10%", product: "PLUS", margin: "0%" },
        { type: "Cepnr -20%", product: "PLUS", margin: "0%" }
    ],
    marginsDivers: [
        { type: "NF Habitat HQE", product: "PLUS", margin: "0%" },
        { type: "Logt individuel", product: "PLUS", margin: "0%" },
        { type: "Indiv + Jardin", product: "PLUS", margin: "0%" },
        { type: "Traversant", product: "PLUS", margin: "0%" },
        { type: "Balcon/Terrasse", product: "PLUS", margin: "0%" },
        { type: "Secteur ABF", product: "PLUS", margin: "0%" },
        { type: "Ascenseur < R+3", product: "PLUS", margin: "0%" },
        { type: "Locaux coll.", product: "PLUS", margin: "0%" },
        { type: "Zone 3 Certifié", product: "PLUS", margin: "0%" }
    ],
    accessoryRents: [
        { type: "Garage", product: "PLAI", maxRent: "0 €", condition: "" },
        { type: "Garage", product: "PLUS", maxRent: "32 €", condition: "" },
        { type: "Garage", product: "PLS", maxRent: "32 €", condition: "" },
        { type: "Carport", product: "PLAI", maxRent: "0 €", condition: "" },
        { type: "Carport", product: "PLUS", maxRent: "16 €", condition: "" },
        { type: "Carport", product: "PLS", maxRent: "16 €", condition: "" },
        { type: "Stationnement", product: "PLAI", maxRent: "0 €", condition: "" },
        { type: "Stationnement", product: "PLUS", maxRent: "16 €", condition: "" },
        { type: "Stationnement", product: "PLS", maxRent: "16 €", condition: "" }
    ],
    hasMargins: false, hasRents: false, footnotes: ["* Mega bonus: conditions spécifiques (voir tableau)."]
};

// 3. CUD
const CUD_DEF = {
    ...DDTM_DEF, id: 'cud', name: 'Communauté Urbaine de Dunkerque', lastUpdated: 'Juillet 2025',
    subsidiesState: [
        { type: "PLAI - DC", amount: "6 452 €", condition: "/lgt" },
        { type: "PLAI Adapté (Ord)", amount: "16 480 €", condition: "1-3 lgts" },
        { type: "PLAI Adapté (Str)", amount: "8 980 €", condition: "> 3 lgts" },
        { type: "PLAI - AA (Bonus)", amount: "16 000 €", condition: "Struct." },
        { type: "PLUS - AA (Mega)", amount: "20 000 €", condition: "/lgt*" },
        { type: "Pensions/RS", amount: "7 500 €", condition: "Suppl." }
    ],
    subsidiesEPCI: [
        { type: "PLAI (Neuf)", amount: "15 000 €", condition: "/lgt" },
        { type: "PLAI Adapté", amount: "18 000 €", condition: "/lgt" },
        { type: "PLUS (Neuf)", amount: "2 000 €", condition: "/lgt" },
        { type: "PLAI RO", amount: "15 000 €", condition: "Réhab" },
        { type: "PLUS RO", amount: "3 000 €", condition: "Réhab" },
        { type: "PLAI AA Base", amount: "15 000 €", condition: "< 145kWh" },
        { type: "PLAI AA BBC", amount: "+ 1 000 €", condition: "Rénov 24" },
        { type: "PLAI AA Indiv", amount: "+ 2 000 €", condition: "Maison" },
        { type: "PLAI AA Adapté", amount: "+ 3 000 €", condition: "Si DC" },
        { type: "PLUS AA Base", amount: "6 000 €", condition: "< 145kWh" },
        { type: "PLUS AA BBC", amount: "+ 1 000 €", condition: "Rénov 24" },
        { type: "PLUS AA Indiv", amount: "+ 2 000 €", condition: "Maison" },
        { type: "Ascenseur <R+3", amount: "20 000 €", condition: "Aide CD" },
        { type: "Restructuration", amount: "2 500 €", condition: "Grands lgts" }
    ],
    subsidiesNPNRU: [
        { type: "Subv. PLAI", amount: "6 300+1 500", condition: "Doublé si AA" },
        { type: "Prêt PLAI", amount: "7 900+1 900", condition: "Doublé si AA" },
        { type: "Prêt PLUS", amount: "6 700+5 600", condition: "Double si AA" }
    ],
    subsidiesCD: [
        { type: "CD PLAI", amount: "27 000 €", condition: "Forfait" },
        { type: "CD PLAI-A", amount: "33 250 €", condition: "Ttes zones" },
        { type: "CD PLUS", amount: "18 000 €", condition: "Forfait" },
        { type: "CD PLS", amount: "4 000 €", condition: "Forfait" }
    ],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "Z2:0%|Z3:0%" },
        { type: "Bbio-10%", product: "PLUS", margin: "Z2:5%|Z3:6%" },
        { type: "Bbio-20%", product: "PLUS", margin: "Z2:7%|Z3:8%" },
        { type: "Cepnr-10%", product: "PLUS", margin: "Z2:5%|Z3:6%" },
        { type: "Cepnr-20%", product: "PLUS", margin: "Z2:7%|Z3:8%" },
        { type: "Passif / E+", product: "PLUS", margin: "9%" }
    ],
    marginsDivers: [
        { type: "NF Habitat/Presta", product: "PLUS", margin: "0%" },
        { type: "Logt individuel", product: "PLUS", margin: "2%" },
        { type: "Ascenseur < R+3", product: "PLUS", margin: "Formule" },
        { type: "Locaux coll.", product: "PLUS", margin: "Formule" },
        { type: "BBC Rénov 1ère", product: "PLAI", margin: "Z2:4%|Z3:7%" },
        { type: "BBC Rénov 2024", product: "PLUS", margin: "Z2:4%|Z3:7%" }
    ],
    accessoryRents: [
        { type: "Garage", product: "PLAI", maxRent: "15 €", condition: "" },
        { type: "Garage", product: "PLUS", maxRent: "39€ (Boxé)", condition: "30€ (Non)" },
        { type: "Garage", product: "PLS", maxRent: "39€ (Boxé)", condition: "30€ (Non)" },
        { type: "Carport", product: "PLAI", maxRent: "10€/12€", condition: "Local/Fermé" },
        { type: "Carport", product: "PLUS", maxRent: "20€/25€", condition: "Local/Fermé" },
        { type: "Carport", product: "PLS", maxRent: "20€/25€", condition: "Local/Fermé" },
        { type: "Stationnement", product: "PLAI", maxRent: "8 €", condition: "" },
        { type: "Stationnement", product: "PLUS", maxRent: "16 €", condition: "" },
        { type: "Stationnement", product: "PLS", maxRent: "16 €", condition: "" }
    ],
    hasMargins: false, hasRents: true, footnotes: ["* Mega bonus: opérations PLAI Adapté en AA, transformation tertiaire, ou AA > 5000€."]
};

// 4. CAPH
const CAPH_DEF = { ...CUD_DEF, id: 'caph', name: "Porte du Hainaut (CAPH)",
    subsidiesState: CUD_DEF.subsidiesState,
    subsidiesEPCI: [
        { type: "PLAI (Zone U)", amount: "3 000 €", condition: "/lgt" },
        { type: "PLAI (Passif)", amount: "+ 3 000 €", condition: "/lgt" },
        { type: "PLAI (T2 40%)", amount: "+ 1 000 €", condition: "/lgt" },
        { type: "PLAI (Vertueux)", amount: "+ 1 500 €", condition: "/lgt" },
        { type: "PLAI (Cuve)", amount: "+ 500 €", condition: "/cuve" },
        { type: "PLAI AA", amount: "5 000 €", condition: "Max 25k/opé" },
        { type: "PLUS (Zone U)", amount: "1 000 €", condition: "/lgt" },
        { type: "PLUS (Passif)", amount: "+ 3 000 €", condition: "/lgt" },
        { type: "PLUS (T2 40%)", amount: "+ 1 000 €", condition: "/lgt" },
        { type: "PLUS (Vertueux)", amount: "+ 1 500 €", condition: "/lgt" },
        { type: "PLUS AA", amount: "+ 1 500 €", condition: "Vertueux" },
        { type: "PLS (Passif)", amount: "+ 1 000 €", condition: "/lgt" },
        { type: "PLS (T2 40%)", amount: "+ 1 000 €", condition: "/lgt" },
        { type: "PLS (Vertueux)", amount: "+ 1 500 €", condition: "/lgt" }
    ],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "0%" },
        { type: "Bbio -10%", product: "PLUS", margin: "0%" },
        { type: "Bbio -20%", product: "PLUS", margin: "0%" },
        { type: "Cepnr -10%", product: "PLUS", margin: "0%" },
        { type: "Cepnr -20%", product: "PLUS", margin: "0%" },
        { type: "Passif", product: "PLUS", margin: "0%" },
        { type: "Energie +", product: "PLUS", margin: "0%" }
    ],
    marginsDivers: [
        { type: "NF Habitat/Presta", product: "PLUS", margin: "0%" },
        { type: "Logt individuel", product: "PLUS", margin: "0%" },
        { type: "Indiv + Jardin", product: "PLUS", margin: "0%" },
        { type: "Traversant", product: "PLUS", margin: "0%" },
        { type: "Balcon/Terrasse", product: "PLUS", margin: "0%" },
        { type: "Secteur ABF", product: "PLUS", margin: "0%" },
        { type: "Ascenseur < R+3", product: "PLUS", margin: "0%" },
        { type: "Locaux coll.", product: "PLUS", margin: "0%" },
        { type: "Zone 3 Certifié", product: "PLUS", margin: "0%" }
    ],
    accessoryRents: [
        { type: "Garage", product: "PLAI", maxRent: "15 €", condition: "" },
        { type: "Garage", product: "PLUS", maxRent: "32 €", condition: "" },
        { type: "Garage", product: "PLS", maxRent: "38 €", condition: "" },
        { type: "Carport", product: "PLAI", maxRent: "10€/12€", condition: "Local/Fermé" },
        { type: "Carport", product: "PLUS", maxRent: "20€/25€", condition: "Local/Fermé" },
        { type: "Carport", product: "PLS", maxRent: "20€/25€", condition: "Local/Fermé" },
        { type: "Stationnement", product: "PLAI", maxRent: "8 €", condition: "" },
        { type: "Stationnement", product: "PLUS", maxRent: "16 €", condition: "" },
        { type: "Stationnement", product: "PLS", maxRent: "16 €", condition: "" }
    ],
};

// 5. CAVM
const CAVM_DEF = { ...CUD_DEF, id: 'cavm', name: "Valenciennes Métropole (CAVM)",
    subsidiesState: [
        { type: "PLAI - DC", amount: "6 452 €", condition: "/lgt" },
        { type: "PLAI Adapté (Ord)", amount: "16 480 €", condition: "1-3 lgts" },
        { type: "PLAI Adapté (Str)", amount: "8 980 €", condition: "En structure" },
        { type: "PLAI - AA", amount: "16 000 €", condition: "Super bonus" },
        { type: "PLUS - AA", amount: "20 000 €", condition: "Mega bonus*" },
        { type: "Pensions/RS", amount: "7 500 €", condition: "Suppl. Adapté" },
        { type: "PLAI - PNRQAD", amount: "13 500 / 11 500", condition: "B1 / B2" },
        { type: "PLUS - PNRQAD", amount: "2 600", condition: "B1 et B2" }
    ],
    subsidiesEPCI: [
        { type: "PLAI / PLUS", amount: "3 000 €", condition: "Neuf Maing/Hergnies" },
        { type: "PLAI AA", amount: "0 €", condition: "PR < 2500" },
        { type: "PLUS AA", amount: "15 000 €", condition: "PR > 2500 + 10% FP" },
        { type: "PLUS AA", amount: "30 000 €", condition: "PR > 2500 + 20% FP" },
        { type: "PLUS AA (Max)", amount: "40 000 €", condition: "PR + 20% FP + ACV" },
        { type: "PLS AA", amount: "0 €", condition: "Non cumulable" },
        { type: "PSLA", amount: "Max 30 000 €", condition: "Groupe 3 + TVA 5.5" },
        { type: "Habitat inclusif", amount: "1 000 €", condition: "Aide EPCI + CD" }
    ],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "0%" },
        { type: "Bbio/Cep -10%", product: "PLUS", margin: "5%" },
        { type: "Bbio/Cep -20%", product: "PLUS", margin: "7%" }
    ],
    marginsDivers: [
        { type: "NF Habitat/Presta", product: "PLUS", margin: "3%" },
        { type: "Logt individuel", product: "PLUS", margin: "3%" },
        { type: "Indiv + Jardin", product: "PLUS", margin: "3% / 2% (PLAI)" },
        { type: "Traversant/Double", product: "PLUS", margin: "2%" },
        { type: "Balcon/Terrasse", product: "PLUS", margin: "2%" },
        { type: "Secteur ABF", product: "PLUS", margin: "5% / 2% (PLAI)" },
        { type: "Ascenseur < R+3", product: "PLUS", margin: "4%" },
        { type: "Locaux coll.", product: "PLUS", margin: "Formule" },
        { type: "Zone 3 Certifié", product: "PLUS", margin: "8%" }
    ],
    accessoryRents: CAPH_DEF.accessoryRents, // Mêmes loyers que CAPH
};

// 6. CAD
const CAD_DEF = { ...CUD_DEF, id: 'cad', name: "Douaisis Agglo (CAD)",
    subsidiesState: CUD_DEF.subsidiesState,
    subsidiesEPCI: [
        { type: "PLAI", amount: "3 000 €", condition: "/lgt" },
        { type: "PLAI (Petits)", amount: "+ 5 000 €", condition: "Studio/T1/T2" },
        { type: "PLAI (GDV)", amount: "+ 5 000 €", condition: "Gens Voyage" },
        { type: "PLAI Adapté", amount: "5 000 €", condition: "Cumul PLAI" },
        { type: "PLUS", amount: "3 000 €", condition: "Maing/Hergnies" },
        { type: "PLAI AA", amount: "5 000 €", condition: "Cumul PLAI" },
        { type: "PSLA", amount: "5 000 €", condition: "PV max 2000" },
        { type: "Accession", amount: "5 000 €", condition: "PV max 2250" },
        { type: "Habitat inclusif", amount: "1 000 €", condition: "Aide EPCI" }
    ],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "0%" },
        { type: "Cep-10%", product: "PLUS", margin: "3%" },
        { type: "Energie positive", product: "PLUS", margin: "7%" },
        { type: "RO NPNRU - Base", product: "PLUS", margin: "0%" },
        { type: "RO NPNRU - Cep/Bbio-10", product: "PLUS", margin: "5%" },
        { type: "RO NPNRU - Cep/Bbio-20", product: "PLUS", margin: "7%" }
    ],
    marginsDivers: [
        { type: "NF Habitat HQE", product: "PLUS", margin: "4%" },
        { type: "Zone 3 > RT2012", product: "PLUS", margin: "+ 1%" },
        { type: "Ascenseur < R+3", product: "PLUS", margin: "Formule" },
        { type: "BBC Rénov 2025 1ère", product: "PLAI", margin: "3%" },
        { type: "BBC Rénov 2025", product: "PLAI", margin: "6%" },
        { type: "BBC Rénov 2025 Z3", product: "PLAI", margin: "+ 1%" },
        { type: "BBC Rénov 2025 1ère", product: "PLUS", margin: "2%" },
        { type: "BBC Rénov 2025", product: "PLUS", margin: "4%" },
        { type: "BBC Rénov 2025 Z3", product: "PLUS", margin: "+ 1%" }
    ],
    accessoryRents: [
        { type: "Garage", product: "PLAI", maxRent: "0 €", condition: "" },
        { type: "Garage", product: "PLUS/PLS", maxRent: "32 €", condition: "" },
        { type: "Carport", product: "PLAI", maxRent: "0 €", condition: "" },
        { type: "Carport", product: "PLUS/PLS", maxRent: "16 €", condition: "" },
        { type: "Stationnement", product: "PLAI", maxRent: "0 €", condition: "" },
        { type: "Stationnement", product: "PLUS/PLS", maxRent: "16 €", condition: "" }
    ],
};

// 7. CAMVS
const CAMVS_DEF = { ...CUD_DEF, id: 'camvs', name: "Maubeuge Val de Sambre (CAMVS)",
    subsidiesState: CUD_DEF.subsidiesState,
    subsidiesEPCI: [{ type: "Aide", amount: "Variable", condition: "Selon délib" }],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "0%" },
        { type: "Bbio -10%", product: "PLUS", margin: "6%" },
        { type: "Bbio -20%", product: "PLUS", margin: "8%" },
        { type: "Cepnr -10%", product: "PLUS", margin: "6%" },
        { type: "Cepnr -20%", product: "PLUS", margin: "8%" }
    ],
    marginsDivers: [
        { type: "NF Habitat", product: "PLUS", margin: "3%" },
        { type: "Indiv/Jardin", product: "PLUS", margin: "3%" },
        { type: "Ascenseur", product: "PLUS", margin: "4%" },
        { type: "Zone 3 + Certif", product: "PLUS", margin: "8%" }
    ],
    accessoryRents: CAPH_DEF.accessoryRents,
};

const ALL_REFS_DEF = [DDTM_DEF, MEL_DEF, CUD_DEF, CAPH_DEF, CAVM_DEF, CAD_DEF, CAMVS_DEF];

// --- UTILS ---
const getRefIdFromEpci = (epciName: string) => {
    const n = epciName.toLowerCase();
    if (n.includes("lille")) return 'mel';
    if (n.includes("dunkerque")) return 'cud';
    if (n.includes("porte du hainaut")) return 'caph';
    if (n.includes("douaisis") || n.includes("douai")) return 'cad';
    if (n.includes("valenciennes") || n.includes("cavm")) return 'cavm';
    if (n.includes("sambre") || n.includes("maubeuge")) return 'camvs';
    return 'ddtm';
};

const parseCurrency = (v: string) => { 
    if(!v) return 0;
    const m = v.match(/(\d+)/g); return m ? Math.max(...m.map(n => parseInt(n))) : 0; 
};
const formatCurrency = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const getMarginValue = (marginStr: string, zoneRental: string) => {
    if (!marginStr || !marginStr.includes("Z")) return marginStr;
    if (zoneRental === "2" && marginStr.includes("Z2:")) return marginStr.match(/Z2:([^|]+)/)?.[1] || marginStr;
    if (zoneRental === "3" && marginStr.includes("Z3:")) return marginStr.match(/Z3:([^|]+)/)?.[1] || marginStr;
    return marginStr.replace("Z2:", "Z2: ").replace("|Z3:", " | Z3: ");
};

// --- TYPES ---
const ViewState = { HOME: 'HOME', RESULT: 'RESULT', ERROR: 'ERROR' };

export interface HousingStats { socialHousingRate: number; targetRate: number; deficit: boolean; exempt?: boolean; }
export interface Zoning { accession: string; rental: string; }
export interface Source { title: string; uri: string; }
export interface CommuneData { id?: string; name: string; insee: string; epci: string; population: number; directionTerritoriale?: string; stats: HousingStats; zoning: Zoning; sources?: Source[]; lastUpdated?: string; isApiSource?: boolean; }
export interface ReferenceData { id: string; name: string; lastUpdated: string; subsidiesState: any[]; subsidiesEPCI?: any[]; subsidiesNPNRU: any[]; subsidiesCD: any[]; marginsRE2020?: any[]; marginsDivers?: any[]; margins?: any[]; accessoryRents?: any[]; footnotes?: string[]; hasMargins: boolean; hasRents: boolean; }

// --- SERVICES DB ---
const getCommunesCollection = () => { // @ts-ignore
    return collection(db, ...PUBLIC_DATA_PATH); 
};
const getRefsCollection = () => { // @ts-ignore
    return collection(db, ...REFS_DATA_PATH); 
};

const fetchAllCommunes = async () => {
  try { const snap = await getDocs(getCommunesCollection()); return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommuneData)); } catch { return []; }
};

const fetchReferenceData = async (epciId: string): Promise<ReferenceData | null> => {
    try {
        // @ts-ignore
        const refDoc = await getDoc(doc(db, ...REFS_DATA_PATH, epciId));
        if (refDoc.exists()) return refDoc.data() as ReferenceData;
        return null;
    } catch { return null; }
};

const saveReferenceData = async (data: ReferenceData) => {
    try {
        // @ts-ignore
        await setDoc(doc(db, ...REFS_DATA_PATH, data.id), data);
        return true;
    } catch (e) { console.error(e); return false; }
};

const saveCommuneToDb = async (commune: CommuneData) => {
  try {
    const docId = commune.insee;
    // @ts-ignore
    const docRef = doc(db, ...PUBLIC_DATA_PATH, docId);
    const { isApiSource, ...dataToSave } = commune;
    await setDoc(docRef, { ...dataToSave, lastUpdated: new Date().toLocaleDateString('fr-FR') });
    return true;
  } catch (err) { return false; }
};

const deleteCommuneFromDb = async (insee: string) => {
    try { // @ts-ignore
        await deleteDoc(doc(db, ...PUBLIC_DATA_PATH, insee)); return true; 
    } catch { return false; }
}

const seedDatabase = async () => {
    const commSnap = await getDocs(getCommunesCollection());
    if (commSnap.empty) {
        const batch = writeBatch(db);
        FULL_DB_59.forEach((c) => { // @ts-ignore
            batch.set(doc(db, ...PUBLIC_DATA_PATH, c.insee), { ...c, lastUpdated: new Date().toLocaleDateString('fr-FR') });
        });
        await batch.commit();
    }
    // Seed Refs if empty
    const refSnap = await getDocs(getRefsCollection());
    if (refSnap.empty) {
        const batch = writeBatch(db);
        ALL_REFS_DEF.forEach((r) => { // @ts-ignore
            batch.set(doc(db, ...REFS_DATA_PATH, r.id), r);
        });
        await batch.commit();
    }
    return true;
};

// --- API GEO & UTILS ---
const searchGeoApi = async (term: string): Promise<CommuneData[]> => {
    if (term.length < 2) return [];
    try {
        const response = await fetch(`https://geo.api.gouv.fr/communes?codeDepartement=59&nom=${term}&fields=nom,code,population,epci&boost=population&limit=5`);
        const data = await response.json();
        return data.map((item: any) => {
            const epciName = item.epci ? item.epci.nom : "Non renseigné";
            let autoDT = "À définir";
            if (epciName.includes("Lille") || epciName.includes("Pévèle")) autoDT = "DDTM Métropole";
            else if (epciName.includes("Dunkerque") || epciName.includes("Flandre")) autoDT = "Flandre Grand Littoral";
            else if (epciName.includes("Valenciennes") || epciName.includes("Porte du Hainaut") || epciName.includes("Douaisis") || epciName.includes("Cambrai") || epciName.includes("Sambre")) autoDT = "Hainaut - Douaisis - Cambrésis";
            return {
                insee: item.code, name: item.nom, population: item.population, epci: epciName, directionTerritoriale: autoDT,
                stats: { socialHousingRate: 0, targetRate: 20, deficit: false, exempt: false },
                zoning: { accession: "C", rental: "3" }, // Défaut
                isApiSource: true
            };
        });
    } catch { return []; }
};

// --- COMPOSANTS UI ---

const StatsCard = ({ title, value, subValue, icon, alert, isApiGenerated }: any) => (
  <div className={`relative bg-white rounded-lg shadow-sm p-3 border-l-4 ${alert ? 'border-red-500' : 'border-brand-500'} flex items-start justify-between overflow-hidden group hover:shadow-md h-full`}>
    {isApiGenerated && <div className="absolute top-0 right-0 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-bl text-[8px] font-bold uppercase flex items-center gap-1 border-b border-l border-yellow-200"><CloudDownload className="w-2 h-2" /> API</div>}
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{title}</p>
      <p className={`text-lg font-bold leading-tight ${isApiGenerated ? 'text-gray-700' : 'text-gray-900'}`}>{value}</p>
      {subValue && <p className="text-[10px] text-gray-500 mt-0.5">{subValue}</p>}
    </div>
    {icon && <div className="text-blue-600 p-1.5 bg-blue-50 rounded-md">{React.cloneElement(icon, { size: 16 })}</div>}
  </div>
);

const SectionTable = ({ title, data, columns, headerColor = "bg-gray-100 text-gray-800", alert, onEdit }: { title: string; data: any[]; columns: any[]; headerColor?: string; alert?: boolean; onEdit?: (idx: number, field: string, val: string) => void }) => {
    if (!data || data.length === 0) return null;
    return (
        <div className={`border rounded-lg overflow-hidden border-gray-200 shadow-sm flex flex-col`}>
            <div className={`px-3 py-1.5 border-b border-gray-200 font-bold text-[11px] ${alert ? 'bg-red-50 text-red-700 border-red-100' : headerColor} flex justify-between items-center`}>
                <span>{title}</span>
            </div>
            <div className="overflow-auto">
                <table className="w-full text-[10px]">
                    <thead className="bg-gray-50 text-gray-500 sticky top-0">
                        <tr>{columns.map((col, idx) => <th key={idx} className="px-2 py-1 text-left font-medium">{col.header}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-gray-50">
                                {columns.map((col, cIdx) => (
                                    <td key={cIdx} className={`px-2 py-1 ${col.isBold ? 'font-bold' : 'text-gray-700'}`}>
                                        {onEdit ? (
                                            <input 
                                                className="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:bg-white outline-none"
                                                value={row[col.accessor] || ''}
                                                onChange={(e) => onEdit(rIdx, col.accessor, e.target.value)}
                                            />
                                        ) : (
                                            col.render ? col.render(row) : (col.accessor ? row[col.accessor] : "")
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ReferenceTable = ({ data, communeZone, isAdmin, onSave }: { data: ReferenceData; communeZone: string; isAdmin: boolean; onSave: (newData: ReferenceData) => void }) => {
    const [editData, setEditData] = useState<ReferenceData | null>(null);

    useEffect(() => { setEditData(null); }, [data.id]);

    const handleEditStart = () => setEditData(JSON.parse(JSON.stringify(data)));
    const handleEditSave = () => { if(editData) { onSave(editData); setEditData(null); } };
    const handleCancel = () => setEditData(null);

    const currentData = editData || data;
    const isEditing = !!editData;

    const updateSection = (section: keyof ReferenceData, index: number, field: string, value: string) => {
        if (!editData) return;
        const list = [...(editData[section] as any[])];
        list[index] = { ...list[index], [field]: value };
        setEditData({ ...editData, [section]: list });
    };

    return (
        <div className={`bg-white rounded-xl shadow-lg border ${isEditing ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'} overflow-hidden mt-6 transition-all`}>
            <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm flex items-center gap-2"><FileText className="w-4 h-4"/> {isEditing ? 'ÉDITION : ' : ''}Référentiel : {data.name}</h3>
                    {isEditing && <span className="bg-yellow-500 text-black text-[9px] px-2 py-0.5 rounded font-bold">MODE ÉDITION</span>}
                </div>
                
                {isAdmin && !isEditing && (
                    <button onClick={handleEditStart} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1"><Edit3 className="w-3 h-3"/> Modifier les règles</button>
                )}
                {isAdmin && isEditing && (
                    <div className="flex gap-2">
                        <button onClick={handleCancel} className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded">Annuler</button>
                        <button onClick={handleEditSave} className="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded flex items-center gap-1"><Save className="w-3 h-3"/> Enregistrer</button>
                    </div>
                )}
            </div>

            <div className="p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-3">
                    <SectionTable title="1. Subventions État" data={currentData.subsidiesState} headerColor="bg-blue-100 text-blue-900" columns={[{ header: "Type", accessor: "type" }, { header: "Montant", accessor: "amount", isBold: true }, { header: "Cond.", accessor: "condition" }]} onEdit={isEditing ? (i,f,v) => updateSection('subsidiesState', i, f, v) : undefined} />
                    <SectionTable title={`2. Aides EPCI (${data.id.toUpperCase()})`} data={currentData.subsidiesEPCI || []} headerColor="bg-orange-100 text-orange-900" columns={[{ header: "Type", accessor: "type" }, { header: "Montant", accessor: "amount", isBold: true }, { header: "Cond.", accessor: "condition" }]} onEdit={isEditing ? (i,f,v) => updateSection('subsidiesEPCI', i, f, v) : undefined} />
                </div>
                <div className="space-y-3">
                    <SectionTable title="3. Aides NPNRU" data={currentData.subsidiesNPNRU} headerColor="bg-purple-100 text-purple-900" columns={[{ header: "Type", accessor: "type" }, { header: "Montant", accessor: "amount", isBold: true }, { header: "Cond.", accessor: "condition" }]} onEdit={isEditing ? (i,f,v) => updateSection('subsidiesNPNRU', i, f, v) : undefined} />
                    <SectionTable title="4. Conseil Départemental (CD)" data={currentData.subsidiesCD} headerColor="bg-green-100 text-green-900" columns={[{ header: "Type", accessor: "type" }, { header: "Montant", accessor: "amount", isBold: true }, { header: "Cond.", accessor: "condition" }]} onEdit={isEditing ? (i,f,v) => updateSection('subsidiesCD', i, f, v) : undefined} />
                </div>
                <div className="space-y-3">
                    <SectionTable title="5A. Marges RE 2020" data={currentData.marginsRE2020 || []} headerColor="bg-orange-100 text-orange-900" columns={[{ header: "Critère", accessor: "type" }, { header: "Produit", accessor: "product" }, { header: "Marge", accessor: "margin", isBold: true, render: isEditing ? undefined : (row: any) => <span className="font-bold text-orange-700">{getMarginValue(row.margin, communeZone)}</span> }]} onEdit={isEditing ? (i,f,v) => updateSection('marginsRE2020', i, f, v) : undefined} />
                    <SectionTable title="5B. Marges Diverses" data={currentData.marginsDivers || []} headerColor="bg-orange-50 text-orange-800" columns={[{ header: "Critère", accessor: "type" }, { header: "Produit", accessor: "product" }, { header: "Marge", accessor: "margin", isBold: true, render: isEditing ? undefined : (row: any) => <span className="font-bold text-orange-700">{getMarginValue(row.margin, communeZone)}</span> }]} onEdit={isEditing ? (i,f,v) => updateSection('marginsDivers', i, f, v) : undefined} />
                    <SectionTable title="6. Loyers Accessoires" data={currentData.accessoryRents || []} headerColor="bg-yellow-100 text-yellow-900" columns={[{ header: "Type", accessor: "type" }, { header: "Produit", accessor: "product" }, { header: "Loyer Max", accessor: "maxRent", isBold: true }, { header: "Cond.", accessor: "condition" }]} onEdit={isEditing ? (i,f,v) => updateSection('accessoryRents', i, f, v) : undefined} />
                </div>
            </div>
        </div>
    );
};

const SimulationPanel = ({ referenceData }: { referenceData: ReferenceData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [plai, setPlai] = useState(0);
  const [plus, setPlus] = useState(0);
  const [pls, setPls] = useState(0);
  const [includeCD, setIncludeCD] = useState(true);

  const calculateTotal = () => {
     let total = 0;
     const statePLAI = parseCurrency(referenceData.subsidiesState.find(s => s.type.includes("PLAI") || s.type.includes("DC"))?.amount || "0");
     const statePLUS = parseCurrency(referenceData.subsidiesState.find(s => s.type.includes("PLUS"))?.amount || "0");
     total += (plai * statePLAI) + (plus * statePLUS);
     if(referenceData.subsidiesEPCI) {
         const epciAmount = parseCurrency(referenceData.subsidiesEPCI[0]?.amount || "0");
         total += ((plai + plus) * epciAmount);
     }
     const cdPLAI = parseCurrency(referenceData.subsidiesCD.find(s => s.type.includes("PLAI"))?.amount || "0");
     total += (plai * cdPLAI) + (plus * (cdPLAI/2)); 
     return total;
  };

  if(!isOpen) return <div className="flex justify-center mt-6"><button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full shadow-md flex items-center gap-2 font-bold text-sm transition-transform hover:scale-105"><Calculator className="w-4 h-4" /> Simuler les aides</button></div>;

  return (
      <div className="mt-6 bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden animate-fade-in">
          <div className="bg-blue-600 px-4 py-2 flex justify-between items-center text-white"><h3 className="font-bold flex items-center gap-2 text-sm"><Calculator className="w-4 h-4"/> Simulateur Rapide</h3><button onClick={() => setIsOpen(false)}><ChevronUp className="w-4 h-4"/></button></div>
          <div className="p-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-blue-50 p-2 rounded"><label className="block text-[10px] font-bold text-blue-800 mb-1">Nb PLAI</label><input type="number" min="0" value={plai} onChange={e => setPlai(parseInt(e.target.value)||0)} className="w-full text-center font-bold text-sm bg-white border rounded p-1" /></div>
                  <div className="bg-orange-50 p-2 rounded"><label className="block text-[10px] font-bold text-orange-800 mb-1">Nb PLUS</label><input type="number" min="0" value={plus} onChange={e => setPls(parseInt(e.target.value)||0)} className="w-full text-center font-bold text-sm bg-white border rounded p-1" /></div>
                  <div className="bg-green-50 p-2 rounded"><label className="block text-[10px] font-bold text-green-800 mb-1">Nb PLS</label><input type="number" min="0" value={pls} onChange={e => setPls(parseInt(e.target.value)||0)} className="w-full text-center font-bold text-sm bg-white border rounded p-1" /></div>
              </div>
              <div className="bg-gray-900 text-white p-3 rounded-lg text-center"><p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Total Estimé (État + EPCI + CD)</p><p className="text-2xl font-bold text-green-400">{formatCurrency(calculateTotal())}</p></div>
          </div>
      </div>
  );
};

const Dashboard = ({ data, isAdmin }: { data: CommuneData; isAdmin: boolean }) => {
    const [refData, setRefData] = useState<ReferenceData | null>(null);
    const isPinel = ["A", "Abis", "B1"].includes(data.zoning.accession);

    useEffect(() => {
        const loadRef = async () => {
            const refId = getRefIdFromEpci(data.epci);
            // Try fetch from DB first
            let r = await fetchReferenceData(refId);
            if (!r) {
                // Fallback to default constants if not in DB yet
                if(refId === 'mel') r = MEL_DEF;
                else if(refId === 'cud') r = CUD_DEF;
                else if(refId === 'caph') r = CAPH_DEF;
                else if(refId === 'cavm') r = CAVM_DEF;
                else if(refId === 'cad') r = CAD_DEF;
                else if(refId === 'camvs') r = CAMVS_DEF;
                else r = DDTM_DEF;
            }
            setRefData(r);
        };
        loadRef();
    }, [data.epci]);

    const handleRefSave = async (newData: ReferenceData) => {
        await saveReferenceData(newData);
        setRefData(newData);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center gap-4 mb-4 border-b pb-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Landmark className="w-5 h-5 text-blue-600" /> {data.name}<span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{data.epci}</span></h2>
                    {data.directionTerritoriale && <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-600 ml-1"><MapPinned className="w-3 h-3 text-blue-500" /><span>DT : <strong>{data.directionTerritoriale}</strong></span></div>}
                </div>
                <div className="flex gap-2">
                    {data.isApiSource && <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200 text-[10px]"><CloudDownload className="w-3 h-3" /> Donnée API</span>}
                    {isPinel && <div className="flex items-center gap-1 bg-green-50 text-green-800 px-2 py-1 rounded border border-green-100 text-[10px]"><Target className="w-3 h-3" /> <span className="font-bold">Eligible Pinel</span></div>}
                    {data.stats.exempt && <div className="flex items-center gap-1 bg-indigo-50 text-indigo-800 px-2 py-1 rounded border border-indigo-100 text-[10px]"><BadgeCheck className="w-3 h-3" /> <span className="font-bold">Exonérée</span></div>}
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <StatsCard title="Population" value={data.population.toLocaleString()} icon={<Users className="w-3 h-3"/>} />
                <StatsCard title="Taux SRU" value={`${data.stats.socialHousingRate}%`} subValue={`Cible: ${data.stats.targetRate}%`} alert={data.stats.deficit} icon={data.stats.deficit ? <AlertTriangle className="w-3 h-3 text-red-500"/> : <CheckCircle className="w-3 h-3 text-green-500"/>} isApiGenerated={data.isApiSource} />
                <StatsCard title="Zone Accession" value={data.zoning.accession} subValue={isPinel ? "Zone Pinel" : "Non Pinel"} icon={<MapPin className="w-3 h-3"/>} isApiGenerated={data.isApiSource} />
                <StatsCard title="Zone Locative" value={data.zoning.rental} subValue="PLUS / PLAI" icon={<Building2 className="w-3 h-3"/>} isApiGenerated={data.isApiSource} />
            </div>
            
            {refData ? (
                <>
                    <ReferenceTable data={refData} communeZone={data.zoning.rental} isAdmin={isAdmin} onSave={handleRefSave} />
                    <SimulationPanel referenceData={refData} />
                </>
            ) : <div className="p-8 text-center text-gray-400">Chargement du référentiel...</div>}
        </div>
    );
};

// --- ADMIN COMMUNE ---
const AdminCommuneEditor = ({ onClose, initialData }: { onClose: () => void; initialData: CommuneData[] }) => {
  const [communes, setCommunes] = useState<CommuneData[]>(initialData);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CommuneData | null>(null);

  const filteredData = useMemo(() => {
    if (!search) return communes;
    const lower = search.toLowerCase();
    return communes.filter(c => c.name.toLowerCase().includes(lower) || c.insee.includes(lower));
  }, [communes, search]);

  const handleEdit = (c: CommuneData) => { setEditingId(c.insee); setEditForm({ ...c }); };
  const handleSave = async () => {
      if (!editForm) return;
      await saveCommuneToDb(editForm);
      setCommunes(prev => {
          const idx = prev.findIndex(c => c.insee === editForm.insee);
          if (idx >= 0) { const n = [...prev]; n[idx] = editForm; return n; }
          return [...prev, editForm];
      });
      setEditingId(null);
  };
  
  const handleFormChange = (f: string, v: any, n?: string) => {
      setEditForm(prev => {
        if (!prev) return null;
        if (n) {
            // @ts-ignore
            return { ...prev, [n]: { ...prev[n], [f]: v } };
        }
        return { ...prev, [f]: v };
    });
  };

  const handleDelete = async (insee: string) => {
      if(confirm("Supprimer définitivement cette commune ?")) {
          const success = await deleteCommuneFromDb(insee);
          if(success) {
              setCommunes(prev => prev.filter(c => c.insee !== insee));
          }
      }
  };

  const handleCreate = () => {
      const newCommune: CommuneData = {
          insee: "", name: "Nouvelle Commune", epci: "", population: 0, directionTerritoriale: "",
          stats: { socialHousingRate: 0, targetRate: 25, deficit: false, exempt: false },
          zoning: { accession: "", rental: "" }
      };
      setEditForm(newCommune);
      setEditingId("NEW");
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
            <h3 className="font-bold">Base de Données Communes ({communes.length})</h3>
            <div className="flex gap-2">
                <button onClick={handleCreate} className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Plus className="w-4 h-4"/> Ajouter</button>
                <button onClick={onClose}><X className="w-5 h-5" /></button>
            </div>
        </div>
        <div className="bg-slate-50 p-4 border-b">
             <input type="text" placeholder="Filtrer..." value={search} onChange={e => setSearch(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div className="flex-grow overflow-auto bg-white">
          <table className="w-full text-xs text-left">
             <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">INSEE</th><th className="p-2">Nom</th><th className="p-2">Zonage</th><th className="p-2">Action</th></tr></thead>
             <tbody>
                {editingId === "NEW" && editForm && (
                     <tr className="bg-green-50 border-b">
                        <td className="p-2"><input className="w-full border p-1" value={editForm.insee} onChange={e => handleFormChange('insee', e.target.value)} placeholder="Code INSEE" /></td>
                        <td className="p-2"><input className="w-full border p-1" value={editForm.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="Nom" /></td>
                        <td className="p-2" colSpan={1}></td>
                        <td className="p-2 flex gap-1">
                            <button onClick={handleSave} className="bg-green-600 text-white px-2 py-1 rounded">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-gray-500 px-2">X</button>
                        </td>
                     </tr>
                )}
                {filteredData.map(c => (
                    <tr key={c.insee} className="border-b hover:bg-gray-50">
                        {editingId === c.insee && editForm ? (
                            <>
                                <td className="p-2">{c.insee}</td>
                                <td className="p-2"><input value={editForm.name} onChange={e => handleFormChange('name', e.target.value)} className="border p-1 w-full" /></td>
                                <td className="p-2 flex gap-1"><input value={editForm.zoning.accession} onChange={e => handleFormChange('accession', e.target.value, 'zoning')} className="border p-1 w-10 text-center" /><input value={editForm.zoning.rental} onChange={e => handleFormChange('rental', e.target.value, 'zoning')} className="border p-1 w-10 text-center" /></td>
                                <td className="p-2"><button onClick={handleSave} className="bg-green-600 text-white px-2 py-1 rounded">OK</button></td>
                            </>
                        ) : (
                            <>
                                <td className="p-2 text-gray-500">{c.insee}</td>
                                <td className="p-2 font-bold">{c.name}</td>
                                <td className="p-2"><span className="bg-gray-100 px-1 rounded">{c.zoning.accession} / {c.zoning.rental}</span></td>
                                <td className="p-2 flex gap-2">
                                    <button onClick={() => handleEdit(c)} className="text-blue-600"><Edit3 className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(c.insee)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
                                </td>
                            </>
                        )}
                    </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminLogin: React.FC<{ onLogin: () => void; onLogout: () => void; isAdmin: boolean }> = ({ onLogin, onLogout, isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === '1920') {
      onLogin();
      setIsOpen(false);
      setCode('');
      setError(false);
    } else {
      setError(true);
    }
  };

  if (isAdmin) {
    return (
      <button onClick={onLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium text-xs px-3 py-1 bg-red-50 rounded transition-colors">
        <Unlock className="w-3 h-3" /> Admin Off
      </button>
    )
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-xs">
        <Lock className="w-3 h-3" /> Admin
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="font-bold text-gray-800 text-lg mb-4">Authentification</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code PIN"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest text-lg mb-4"
                autoFocus
              />
              {error && <p className="text-red-500 text-xs text-center mb-4">Code incorrect</p>}
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">Accéder</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// --- APP MAIN ---

const App: React.FC = () => {
  const [viewState, setViewState] = useState(ViewState.HOME);
  const [selectedCommune, setSelectedCommune] = useState<CommuneData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<CommuneData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [allCommunes, setAllCommunes] = useState<CommuneData[]>([]);

  useEffect(() => {
    // Connexion anonyme simplifiée
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
      if(user) {
          seedDatabase().then(() => fetchAllCommunes().then(setAllCommunes));
      }
  }, [user]);

  useEffect(() => {
    const search = async () => {
        if (searchTerm.length < 2) { setSuggestions([]); return; }
        setLoading(true);
        const localMatches = allCommunes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
        const apiRes = await searchGeoApi(searchTerm);
        const merged = [...localMatches];
        apiRes.forEach(apiC => {
            if(!merged.find(m => m.insee === apiC.insee)) merged.push(apiC);
        });
        setSuggestions(merged.slice(0, 7));
        setLoading(false);
    };
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [searchTerm, allCommunes]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-lg text-blue-700 cursor-pointer" onClick={() => setViewState(ViewState.HOME)}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Building2 size={18} /></div>
            <span className="text-gray-900">Nord<span className="text-blue-600">Habitat</span></span>
          </div>
          <div className="flex-grow relative max-w-xl">
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher une commune..." className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg outline-none transition-all shadow-inner text-sm" />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            {loading && <div className="absolute right-3 top-2.5"><Loader2 className="w-4 h-4 animate-spin text-blue-500"/></div>}
            {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                    {suggestions.map(s => (
                        <button key={s.insee} onClick={() => { setSelectedCommune(s); setViewState(ViewState.RESULT); setSearchTerm(""); setSuggestions([]); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 flex items-center justify-between border-b border-gray-50 last:border-0 group text-sm">
                            <div className="flex items-center gap-2"><MapPin className={`w-3 h-3 ${s.isApiSource ? 'text-gray-400' : 'text-green-500'}`} /> <span className="font-semibold text-gray-900">{s.name}</span></div>
                            <span className="text-[9px] text-gray-400">{s.epci}</span>
                        </button>
                    ))}
                </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow p-4">
        {viewState === ViewState.HOME && (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center mt-12">
             <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-100 max-w-2xl">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Référentiel Habitat <span className="text-blue-600">Nord (59)</span></h1>
                <p className="text-slate-500 mb-8">Base de données complète (648 communes) avec zonages, taux SRU et financements CUD/MEL/Valenciennes/CAPH.</p>
                {isAdmin && <div className="text-green-600 font-bold text-sm bg-green-50 p-2 rounded border border-green-200">Mode Administrateur Actif</div>}
             </div>
          </div>
        )}

        {viewState === ViewState.RESULT && selectedCommune && (
          <div className="animate-fade-in max-w-7xl mx-auto">
             <button onClick={() => setViewState(ViewState.HOME)} className="text-xs text-slate-500 hover:text-blue-600 mb-4 inline-flex items-center gap-1">&larr; Retour</button>
             <Dashboard data={selectedCommune} isAdmin={isAdmin} />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p className="text-gray-500">© 2024 Nord Habitat Info - Données Firebase</p>
          <div className="flex items-center gap-4">
             {isAdmin && <button onClick={() => setShowEditor(true)} className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 font-medium"><Database className="w-3 h-3" /> Gérer Communes</button>}
             <AdminLogin isAdmin={isAdmin} onLogin={() => setIsAdmin(true)} onLogout={() => { setIsAdmin(false); setShowEditor(false); }} />
          </div>
        </div>
      </footer>

      {showEditor && isAdmin && <AdminCommuneEditor onClose={() => setShowEditor(false)} initialData={allCommunes} />}
    </div>
  );
};

export default App;
