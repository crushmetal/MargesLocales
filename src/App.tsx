import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, MapPin, Building2, Users, AlertTriangle, 
  CheckCircle, Save, Database, Loader2, Plus, Trash2, Lock, Unlock, 
  X, Calculator, ChevronUp, CheckSquare, Square, 
  Landmark, BadgeCheck, MapPinned, Target, Download, FileText, Edit3, ShieldAlert
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';

/**
 * ==========================================
 * 1. CONFIGURATION & TYPES
 * ==========================================
 */

const firebaseConfig = {
  apiKey: "AIzaSyDOBFXdCfEH0IJ_OsIH7rHijYT_NEY1FGA",
  authDomain: "marges-locales59.firebaseapp.com",
  projectId: "marges-locales59",
  storageBucket: "marges-locales59.firebasestorage.app",
  messagingSenderId: "1077584427724",
  appId: "1:1077584427724:web:39e529e17d4021110e6069"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = 'nord-habitat-v1'; 
// Utilisation directe des chaines pour éviter les erreurs de spread
const COMMUNES_COLLECTION_PATH = ['artifacts', APP_ID, 'public', 'data', 'communes'];
const REFS_COLLECTION_PATH = ['artifacts', APP_ID, 'public', 'data', 'references'];

const ViewState = { HOME: 'HOME', RESULT: 'RESULT', ERROR: 'ERROR' };

export interface HousingStats { socialHousingRate: number; targetRate: number; deficit: boolean; exempt?: boolean; }
export interface Zoning { accession: string; rental: string; }
export interface Source { title: string; uri: string; }
export interface CommuneData { id?: string; name: string; insee: string; epci: string; population: number; directionTerritoriale?: string; stats: HousingStats; zoning: Zoning; sources?: Source[]; lastUpdated?: string; isApiSource?: boolean; }
export interface ReferenceData { id: string; name: string; lastUpdated: string; subsidiesState: any[]; subsidiesEPCI?: any[]; subsidiesNPNRU: any[]; subsidiesCD: any[]; marginsRE2020?: any[]; marginsDivers?: any[]; margins?: any[]; accessoryRents?: any[]; footnotes?: string[]; hasMargins: boolean; hasRents: boolean; }

/**
 * ==========================================
 * 2. UTILITAIRES
 * ==========================================
 */

const parseCurrency = (v: string) => { 
    if(!v || typeof v !== 'string') return 0;
    const m = v.match(/(\d+)/g); return m ? Math.max(...m.map(n => parseInt(n))) : 0; 
};

const formatCurrency = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const getMarginValue = (marginStr: string, zoneRental: string) => {
    if (!marginStr || typeof marginStr !== 'string' || !marginStr.includes("Z")) return marginStr || "";
    const z = zoneRental ? zoneRental.toString() : "";
    if (z === "2" && marginStr.includes("Z2:")) return marginStr.match(/Z2:([^|]+)/)?.[1] || marginStr;
    if (z === "3" && marginStr.includes("Z3:")) return marginStr.match(/Z3:([^|]+)/)?.[1] || marginStr;
    return marginStr.replace("Z2:", "Z2: ").replace("|Z3:", " | Z3: ");
};

const getRefIdFromEpci = (epciName: string) => {
    const n = (epciName || "").toLowerCase();
    if (n.includes("lille")) return 'mel';
    if (n.includes("dunkerque")) return 'cud';
    if (n.includes("porte du hainaut")) return 'caph';
    if (n.includes("douaisis") || n.includes("douai")) return 'cad';
    if (n.includes("valenciennes") || n.includes("cavm")) return 'cavm';
    if (n.includes("sambre") || n.includes("maubeuge")) return 'camvs';
    return 'ddtm';
};

/**
 * ==========================================
 * 3. SERVICES DB & API
 * ==========================================
 */

// @ts-ignore
const getCommunesCollection = () => collection(db, 'artifacts', APP_ID, 'public', 'data', 'communes');
// @ts-ignore
const getRefsCollection = () => collection(db, 'artifacts', APP_ID, 'public', 'data', 'references');

const fetchAllCommunes = async () => {
  try { 
      const snap = await getDocs(getCommunesCollection()); 
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommuneData)); 
  } catch (error) { 
      console.error("Erreur lecture DB:", error);
      throw error; 
  }
};

const fetchReferenceData = async (epciId: string): Promise<ReferenceData | null> => {
    try {
        // @ts-ignore
        const refDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'references', epciId));
        if (refDoc.exists()) return refDoc.data() as ReferenceData;
        return null;
    } catch { return null; }
};

const saveReferenceData = async (data: ReferenceData) => {
    try {
        // @ts-ignore
        await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'references', data.id), data);
        return true;
    } catch (e) { console.error(e); return false; }
};

const saveCommuneToDb = async (commune: CommuneData) => {
  try {
    const docId = commune.insee;
    // @ts-ignore
    const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'communes', docId);
    const dataToSave: any = { ...commune };
    if (dataToSave.isApiSource) delete dataToSave.isApiSource;
    await setDoc(docRef, { ...dataToSave, lastUpdated: new Date().toLocaleDateString('fr-FR') });
    return true;
  } catch (err) { return false; }
};

const deleteCommuneFromDb = async (insee: string) => {
    try { 
        // @ts-ignore
        await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'communes', insee)); 
        return true; 
    } catch { return false; }
}

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
                zoning: { accession: "C", rental: "3" }, 
                isApiSource: true
            };
        });
    } catch { return []; }
};

/**
 * ==========================================
 * 4. DONNÉES STATIQUES (SEED)
 * ==========================================
 */
const FULL_DB_59: CommuneData[] = [
  // --- DT FLANDRE GRAND LITTORAL ---
  { insee: "59183", name: "Dunkerque", epci: "CU de Dunkerque", population: 86788, directionTerritoriale: "Flandre Grand Littoral", stats: { socialHousingRate: 35.0, targetRate: 25, deficit: false, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59271", name: "Grande-Synthe", epci: "CU de Dunkerque", population: 20331, directionTerritoriale: "Flandre Grand Littoral", stats: { socialHousingRate: 60.0, targetRate: 25, deficit: false, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59155", name: "Coudekerque-Branche", epci: "CU de Dunkerque", population: 20765, directionTerritoriale: "Flandre Grand Littoral", stats: { socialHousingRate: 30.0, targetRate: 25, deficit: false, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59273", name: "Gravelines", epci: "CU de Dunkerque", population: 11223, directionTerritoriale: "Flandre Grand Littoral", stats: { socialHousingRate: 28.0, targetRate: 20, deficit: false, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59123", name: "Bray-Dunes", epci: "CU de Dunkerque", population: 4380, directionTerritoriale: "Flandre Grand Littoral", stats: { socialHousingRate: 12.5, targetRate: 25, deficit: true, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59668", name: "Zuydcoote", epci: "CU de Dunkerque", population: 1600, directionTerritoriale: "Flandre Grand Littoral", stats: { socialHousingRate: 8.0, targetRate: 25, deficit: true, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59360", name: "Loon-Plage", epci: "CU de Dunkerque", population: 6039, directionTerritoriale: "Flandre Grand Littoral", stats: { socialHousingRate: 25.0, targetRate: 25, deficit: false, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59588", name: "Téteghem-Coudekerque-Village", epci: "CU de Dunkerque", population: 8384, directionTerritoriale: "Flandre Grand Littoral", stats: { socialHousingRate: 24.89, targetRate: 25, deficit: true, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59341", name: "Leffrinckoucke", epci: "CU de Dunkerque", population: 4124, directionTerritoriale: "Flandre Grand Littoral", stats: { socialHousingRate: 25.0, targetRate: 25, deficit: false, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59098", name: "Bourbourg", epci: "CU de Dunkerque", population: 7023, directionTerritoriale: "Flandre Grand Littoral", stats: { socialHousingRate: 25.0, targetRate: 20, deficit: false, exempt: false }, zoning: { accession: "C", rental: "3" } },
  
  // --- DT MÉTROPOLE (MEL) ---
  { insee: "59350", name: "Lille", epci: "Métropole Européenne de Lille", population: 236710, directionTerritoriale: "DDTM Métropole", stats: { socialHousingRate: 24.5, targetRate: 25, deficit: true, exempt: false }, zoning: { accession: "A", rental: "1" } },
  { insee: "59512", name: "Roubaix", epci: "Métropole Européenne de Lille", population: 98892, directionTerritoriale: "DDTM Métropole", stats: { socialHousingRate: 45.2, targetRate: 25, deficit: false, exempt: false }, zoning: { accession: "B1", rental: "1" } },
  { insee: "59599", name: "Tourcoing", epci: "Métropole Européenne de Lille", population: 99011, directionTerritoriale: "DDTM Métropole", stats: { socialHousingRate: 32.1, targetRate: 25, deficit: false, exempt: false }, zoning: { accession: "B1", rental: "1" } },
  { insee: "59648", name: "Villeneuve-d'Ascq", epci: "Métropole Européenne de Lille", population: 62067, directionTerritoriale: "DDTM Métropole", stats: { socialHousingRate: 42.0, targetRate: 25, deficit: false, exempt: false }, zoning: { accession: "B1", rental: "1" } },
  { insee: "59368", name: "Marcq-en-Barœul", epci: "Métropole Européenne de Lille", population: 39356, directionTerritoriale: "DDTM Métropole", stats: { socialHousingRate: 19.4, targetRate: 25, deficit: true, exempt: false }, zoning: { accession: "A", rental: "1" } },
  
  // --- DT HAINAUT - DOUAISIS - CAMBRÉSIS ---
  { insee: "59526", name: "Saint-Amand-les-Eaux", epci: "CA de la Porte du Hainaut", population: 15980, directionTerritoriale: "Hainaut - Douaisis - Cambrésis", stats: { socialHousingRate: 25.5, targetRate: 20, deficit: false, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59606", name: "Valenciennes", epci: "CA Valenciennes Métropole", population: 42991, directionTerritoriale: "Hainaut - Douaisis - Cambrésis", stats: { socialHousingRate: 28.0, targetRate: 20, deficit: false, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59173", name: "Douai", epci: "Douaisis Agglo", population: 39648, directionTerritoriale: "Hainaut - Douaisis - Cambrésis", stats: { socialHousingRate: 32.0, targetRate: 20, deficit: false, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59392", name: "Maubeuge", epci: "CA Maubeuge Val de Sambre", population: 29066, directionTerritoriale: "Hainaut - Douaisis - Cambrésis", stats: { socialHousingRate: 40.0, targetRate: 20, deficit: false, exempt: false }, zoning: { accession: "B2", rental: "2" } },
  { insee: "59122", name: "Cambrai", epci: "CA de Cambrai", population: 31425, directionTerritoriale: "Hainaut - Douaisis - Cambrésis", stats: { socialHousingRate: 22.0, targetRate: 20, deficit: false, exempt: false }, zoning: { accession: "C", rental: "3" } }
];

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
        { type: "Prêt PLUS", amount: "6 700+5 600", condition: "Doublé si AA" }
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
    hasMargins: true, hasRents: true, footnotes: ["* Mega bonus: opérations PLAI Adapté en AA, transformation tertiaire, ou AA > 5000€."]
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
    hasMargins: true, hasRents: true
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

const seedDatabase = async () => {
    // Si la DB échoue, on ne plante pas l'app, on retourne false
    try {
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
    } catch (e) {
        console.error("Seed Failed", e);
        throw e;
    }
};

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
  // @ts-ignore
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [allCommunes, setAllCommunes] = useState<CommuneData[]>(FULL_DB_59); 
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    signInAnonymously(auth)
      .then(() => setDbError(null))
      .catch((error) => {
        console.error("Auth Failed:", error);
        setDbError(`Erreur d'authentification : ${error.code} - ${error.message}`);
      });
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
      if(user) {
          seedDatabase()
            .then(() => fetchAllCommunes())
            .then((res) => {
                if (res.length > 0) {
                    setAllCommunes(res);
                    setDbError(null);
                }
            })
            .catch(err => {
                console.error("DB Error:", err);
                let msg = err.message || "Erreur inconnue";
                if(err.code === 'permission-denied') msg = "Permissions insuffisantes (Vérifiez les règles Firestore)";
                setDbError(msg);
            });
      }
  }, [user]);

  useEffect(() => {
    const search = async () => {
        if (searchTerm.length < 2) { setSuggestions([]); return; }
        setLoading(true);
        const localMatches = allCommunes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
        
        let apiRes: CommuneData[] = [];
        try {
           apiRes = await searchGeoApi(searchTerm);
        } catch (e) {
           console.warn("API Gouv unavailable", e);
        }

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
        {dbError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 mx-auto max-w-4xl rounded shadow-sm flex items-start gap-3">
                <ShieldAlert className="text-red-500 w-6 h-6 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-red-800">Erreur de connexion à la base de données</h3>
                    <p className="text-sm text-red-700 mt-1">{dbError}</p>
                    <p className="text-xs text-red-500 mt-2 italic">L'application fonctionne en mode hors ligne avec les données locales.</p>
                </div>
            </div>
        )}

        {viewState === ViewState.HOME && (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center mt-12">
             <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-100 max-w-2xl">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Référentiel Habitat <span className="text-blue-600">Nord (59)</span></h1>
                <p className="text-slate-500 mb-8">Base de données complète avec édition des référentiels en ligne.</p>
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
