import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, MapPin, Building2, Users, AlertTriangle, 
  CheckCircle, Save, Database, Loader2, Plus, Trash2, Lock, Unlock, 
  X, Calculator, ChevronUp, CheckSquare, Square, 
  Landmark, BadgeCheck, MapPinned, Target, Download, FileText, Edit3, ShieldAlert, Activity,
  Euro, Info, WifiOff, Briefcase, Home, RefreshCw, Layers
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch, initializeFirestore
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged
} from 'firebase/auth';

/**
 * ==========================================
 * 1. CONFIGURATION & TYPES
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const APP_ID = 'nord-habitat-v1';
const PUBLIC_DATA_PATH = ['artifacts', APP_ID, 'public', 'data', 'communes'];
const REFS_DATA_PATH = ['artifacts', APP_ID, 'public', 'data', 'references'];

const ViewState = { HOME: 'HOME', RESULT: 'RESULT', ERROR: 'ERROR' };

/**
 * ==========================================
 * 2. DONNÉES DE RÉFÉRENCE (POUR INITIALISATION SEULEMENT)
 * ==========================================
 */

// Corrections manuelles COMPLÈTES (Avec Population ajoutée)
// Ces données sont chargées instantanément sans attendre le réseau
const MANUAL_OVERRIDES = [
  // VALENCIENNOIS (CAVM / CAPH)
  { insee: "59221", name: "Famars", population: 2500, epci: "CA Valenciennes Métropole", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 0, targetRate: 20, deficit: false } },
  { insee: "59606", name: "Valenciennes", population: 42990, epci: "CA Valenciennes Métropole", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 28.0, targetRate: 20, deficit: false } },
  { insee: "59526", name: "Saint-Amand-les-Eaux", population: 16000, epci: "CA de la Porte du Hainaut", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 25.5, targetRate: 20, deficit: false } },
  
  // METROPOLE LILLOISE (MEL)
  { insee: "59017", name: "Armentières", population: 24800, epci: "Métropole Européenne de Lille", directionTerritoriale: "DDTM Métropole", zoning: { accession: "B1", rental: "2" }, stats: { socialHousingRate: 23.0, targetRate: 25, deficit: true } }, 
  { insee: "59350", name: "Lille", population: 236000, epci: "Métropole Européenne de Lille", directionTerritoriale: "DDTM Métropole", zoning: { accession: "A", rental: "1" }, stats: { socialHousingRate: 24.5, targetRate: 25, deficit: true } },
  { insee: "59512", name: "Roubaix", population: 98000, epci: "Métropole Européenne de Lille", directionTerritoriale: "DDTM Métropole", zoning: { accession: "B1", rental: "1" }, stats: { socialHousingRate: 45.2, targetRate: 25, deficit: false } },
  { insee: "59599", name: "Tourcoing", population: 99000, epci: "Métropole Européenne de Lille", directionTerritoriale: "DDTM Métropole", zoning: { accession: "B1", rental: "1" }, stats: { socialHousingRate: 32.1, targetRate: 25, deficit: false } },
  { insee: "59648", name: "Villeneuve-d'Ascq", population: 62000, epci: "Métropole Européenne de Lille", directionTerritoriale: "DDTM Métropole", zoning: { accession: "B1", rental: "1" }, stats: { socialHousingRate: 42.0, targetRate: 25, deficit: false } },
  { insee: "59368", name: "Marcq-en-Barœul", population: 38500, epci: "Métropole Européenne de Lille", directionTerritoriale: "DDTM Métropole", zoning: { accession: "A", rental: "1" }, stats: { socialHousingRate: 19.4, targetRate: 25, deficit: true } },
  { insee: "59457", name: "Pérenchies", population: 8500, epci: "Métropole Européenne de Lille", directionTerritoriale: "DDTM Métropole", zoning: { accession: "B1", rental: "2" }, stats: { socialHousingRate: 21.0, targetRate: 25, deficit: true } }, 

  // DUNKERQUOIS (CUD)
  { insee: "59183", name: "Dunkerque", population: 86000, epci: "CU de Dunkerque", directionTerritoriale: "Flandre Grand Littoral", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 35.0, targetRate: 25, deficit: false } },
  { insee: "59271", name: "Grande-Synthe", population: 20000, epci: "CU de Dunkerque", directionTerritoriale: "Flandre Grand Littoral", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 60.0, targetRate: 25, deficit: false } },
  { insee: "59155", name: "Coudekerque-Branche", population: 20000, epci: "CU de Dunkerque", directionTerritoriale: "Flandre Grand Littoral", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 30.0, targetRate: 25, deficit: false } },
  { insee: "59273", name: "Gravelines", population: 11000, epci: "CU de Dunkerque", directionTerritoriale: "Flandre Grand Littoral", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 28.0, targetRate: 20, deficit: false } },
  { insee: "59123", name: "Bray-Dunes", population: 4500, epci: "CU de Dunkerque", directionTerritoriale: "Flandre Grand Littoral", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 12.5, targetRate: 25, deficit: true } },
  { insee: "59668", name: "Zuydcoote", population: 1600, epci: "CU de Dunkerque", directionTerritoriale: "Flandre Grand Littoral", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 8.0, targetRate: 25, deficit: true } },
  { insee: "59360", name: "Loon-Plage", population: 6000, epci: "CU de Dunkerque", directionTerritoriale: "Flandre Grand Littoral", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 25.0, targetRate: 25, deficit: false } },
  { insee: "59588", name: "Téteghem-Coudekerque-Village", population: 8300, epci: "CU de Dunkerque", directionTerritoriale: "Flandre Grand Littoral", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 24.89, targetRate: 25, deficit: true } },
  { insee: "59341", name: "Leffrinckoucke", population: 4000, epci: "CU de Dunkerque", directionTerritoriale: "Flandre Grand Littoral", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 25.0, targetRate: 25, deficit: false } },
  { insee: "59098", name: "Bourbourg", population: 7000, epci: "CU de Dunkerque", directionTerritoriale: "Flandre Grand Littoral", zoning: { accession: "C", rental: "3" }, stats: { socialHousingRate: 25.0, targetRate: 20, deficit: false } },
  
  // AUTRES (DOUAISIS / SAMBRE / CAMBRAI)
  { insee: "59173", name: "Douai", population: 39000, epci: "Douaisis Agglo", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 32.0, targetRate: 20, deficit: false } },
  { insee: "59392", name: "Maubeuge", population: 29000, epci: "CA Maubeuge Val de Sambre", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 40.0, targetRate: 20, deficit: false } },
  { insee: "59122", name: "Cambrai", population: 31000, epci: "CA de Cambrai", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "C", rental: "3" }, stats: { socialHousingRate: 22.0, targetRate: 20, deficit: false } }
];

// Référentiels Financiers (Liés à l'EPCI)
const DDTM_DEF = {
    id: 'ddtm', name: 'DDTM 59 (Droit Commun)', lastUpdated: '01/01/2024',
    subsidiesState: [
        { type: "PLAI", amount: "13 500 €", condition: "Par logement (Socle de base)" },
        { type: "PLUS", amount: "5 400 €", condition: "Par logement (Socle de base)" },
        { type: "PLAI Adapté", amount: "Variable", condition: "Selon instruction spécifique DDTM" },
        { type: "Surcharge Foncière", amount: "Selon déficit", condition: "Plafond selon zone (B1/B2/C) et ACM" }
    ],
    subsidiesCD: [
        { type: "CD PLAI", amount: "4 000 €", condition: "Forfaitaire par logement" },
        { type: "CD PLUS", amount: "2 000 €", condition: "Forfaitaire par logement" },
        { type: "CD Habitat Inclusif", amount: "Sur dossier", condition: "Appel à projet spécifique" }
    ],
    subsidiesNPNRU: [{ type: "ANRU", amount: "Variable €", condition: "Selon convention de renouvellement urbain" }],
    marginsRE2020: [{ type: "Marge", product: "Tous", margin: "Selon perf" }],
    marginsDivers: [{ type: "Marge", product: "Tous", margin: "Selon perf" }],
    accessoryRents: [{ type: "Garage", product: "Annexes", maxRent: "60 €", condition: "Zone B1/B2" }],
    footnotes: ["Document de référence interne."],
    hasMargins: true, hasRents: true
};

const MEL_DEF = {
    ...DDTM_DEF, id: 'mel', name: 'Métropole Européenne de Lille', lastUpdated: 'Juillet 2025',
    subsidiesState: [
        { type: "PLAI DC / AA", amount: "9 130 €", condition: "Socle de base. Cumulable avec les Bonus." },
        { type: "PLAI Adapté (Ord)", amount: "16 480 €", condition: "Opérations de 1 à 3 logements." },
        { type: "PLAI Adapté (Str)", amount: "8 980 €", condition: "Opérations en structure collective." },
        { type: "PLAI - AA", amount: "16 000 €", condition: "Super Bonus pour Acquisition-Amélioration." },
        { type: "PLUS - AA", amount: "20 000 €", condition: "Mega Bonus (Conditions spécifiques)." },
        { type: "Résidences Sociales", amount: "7 500 €", condition: "Supplément au socle adapté." },
        { type: "PLAI Octave", amount: "9 130 €", condition: "Non cumulable avec aides État classiques." },
        { type: "PLAI Gens Voyage", amount: "9 130 €", condition: "Non cumulable avec aides État classiques." },
        { type: "Fonds Friches", amount: "Sur dossier", condition: "Appel à projet annuel (DDTM)." }
    ],
    subsidiesEPCI: [
        { type: "PLAI", amount: "15 000 €", condition: "Par logement (Neuf ou AA)." },
        { type: "PLAI (<10 lgts)", amount: "26 000 €", condition: "Opérations de moins de 10 logements." },
        { type: "PLAI AA", amount: "26 000 €", condition: "Acquisition-Amélioration (Plafond)." },
        { type: "PLAI Struct <50", amount: "15 000 €", condition: "Structure collective < 50m² SU." },
        { type: "PLAI Struct >50", amount: "12 000 €", condition: "Structure collective > 50m² SU." },
        { type: "PLAI Octave", amount: "7 500 €", condition: "Cumulable avec aides État." },
        { type: "PLAI Octave CARSAT", amount: "+ 3 500 €", condition: "Bonus si financement CARSAT obtenu." },
        { type: "PLAI Gens Voyage", amount: "15K-30K €", condition: "Variable selon typologie (Terrain/Bâti)." },
        { type: "PLAI Adapté", amount: "16 480 €", condition: "Cumulable avec socle État." },
        { type: "PLAI Adapté Octave", amount: "8 980 €", condition: "Uniquement pour label Octave." },
        { type: "Surcharge Foncière", amount: "Variable €", condition: "Compensation déficit opération (Bilan)." },
        { type: "Désamiantage", amount: "50% Coût HT", condition: "Plafond 10 000 € par logement." },
        { type: "Démolition", amount: "50% Coût HT", condition: "Plafond 15 000 € par logement." }
    ],
    subsidiesNPNRU: [
        { type: "Subv. PLAI", amount: "6 300+1 500 €", condition: "Doublé si Acquisition-Amélioration." },
        { type: "Prêt PLAI", amount: "7 900+1 900 €", condition: "Doublé si Acquisition-Amélioration." },
        { type: "Prêt PLUS", amount: "6 700+5 600 €", condition: "Doublé si Acquisition-Amélioration." },
        { type: "Démolition", amount: "100%", condition: "Prise en charge intégrale si conventionné." }
    ],
    subsidiesCD: [
        { type: "CD PLAI", amount: "27 000 €", condition: "Forfaitaire (Toutes zones)." },
        { type: "CD PLAI Adapté", amount: "33 250 €", condition: "Forfaitaire (Toutes zones)." },
        { type: "CD PLUS", amount: "18 000 €", condition: "Forfaitaire (Toutes zones)." },
        { type: "CD PLS", amount: "4 000 €", condition: "Forfaitaire (Toutes zones)." },
        { type: "Autonomie", amount: "+ 2 000 €", condition: "Si label Habitat Inclusif / Senior." }
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

const CUD_DEF = {
    ...DDTM_DEF, id: 'cud', name: 'Communauté Urbaine de Dunkerque', lastUpdated: 'Juillet 2025',
    subsidiesState: [
        { type: "PLAI - DC", amount: "6 452 €", condition: "Montant par logement (Droit Commun)." },
        { type: "PLAI Adapté (Ord)", amount: "16 480 €", condition: "Opérations 1 à 3 logements." },
        { type: "PLAI Adapté (Str)", amount: "8 980 €", condition: "Opérations de plus de 3 logements." },
        { type: "PLAI - AA (Bonus)", amount: "16 000 €", condition: "Bonus structurel AA." },
        { type: "PLUS - AA (Mega)", amount: "20 000 €", condition: "Mega Bonus (voir conditions)." },
        { type: "Pensions/RS", amount: "7 500 €", condition: "Supplément spécifique." }
    ],
    subsidiesEPCI: [
        { type: "PLAI (Neuf)", amount: "15 000 €", condition: "Par logement neuf." },
        { type: "PLAI Adapté", amount: "18 000 €", condition: "Par logement adapté." },
        { type: "PLUS (Neuf)", amount: "2 000 €", condition: "Par logement neuf." },
        { type: "PLAI RO", amount: "15 000 €", condition: "Réhabilitation Obligatoire." },
        { type: "PLUS RO", amount: "3 000 €", condition: "Réhabilitation Obligatoire." },
        { type: "PLAI AA Base", amount: "15 000 €", condition: "Conso < 145kWh/m²/an." },
        { type: "PLAI AA BBC", amount: "+ 1 000 €", condition: "Label BBC Rénovation 2024." },
        { type: "PLAI AA Indiv", amount: "+ 2 000 €", condition: "Maison individuelle." },
        { type: "PLAI AA Adapté", amount: "+ 3 000 €", condition: "Si financé en Droit Commun." },
        { type: "PLUS AA Base", amount: "6 000 €", condition: "Conso < 145kWh/m²/an." },
        { type: "PLUS AA BBC", amount: "+ 1 000 €", condition: "Label BBC Rénovation 2024." },
        { type: "PLUS AA Indiv", amount: "+ 2 000 €", condition: "Maison individuelle." },
        { type: "Ascenseur <R+3", amount: "20 000 €", condition: "Aide conjointe avec CD." },
        { type: "Restructuration", amount: "2 500 €", condition: "Grands logements (> T4)." }
    ],
    subsidiesNPNRU: [
        { type: "Subv. PLAI", amount: "6 300+1 500 €", condition: "Doublé si AA." },
        { type: "Prêt PLAI", amount: "7 900+1 900 €", condition: "Doublé si AA." },
        { type: "Prêt PLUS", amount: "6 700+5 600 €", condition: "Doublé si AA." }
    ],
    subsidiesCD: [
        { type: "CD PLAI", amount: "27 000 €", condition: "Forfaitaire." },
        { type: "CD PLAI-A", amount: "33 250 €", condition: "Toutes zones." },
        { type: "CD PLUS", amount: "18 000 €", condition: "Forfaitaire." },
        { type: "CD PLS", amount: "4 000 €", condition: "Forfaitaire." }
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

const CAPH_DEF = { ...CUD_DEF, id: 'caph', name: "Porte du Hainaut (CAPH)",
    subsidiesState: CUD_DEF.subsidiesState,
    subsidiesEPCI: [
        { type: "PLAI (Zone U)", amount: "3 000 €", condition: "Par logement (Zone Urbaine)." },
        { type: "PLAI (Passif)", amount: "+ 3 000 €", condition: "Bonus performance Passive." },
        { type: "PLAI (T2 40%)", amount: "+ 1 000 €", condition: "Si 40% de T2 dans l'opération." },
        { type: "PLAI (Vertueux)", amount: "+ 1 500 €", condition: "Matériaux biosourcés." },
        { type: "PLAI (Cuve)", amount: "+ 500 €", condition: "Récupération eau de pluie." },
        { type: "PLAI AA", amount: "5 000 €", condition: "Plafonné à 25 000€ par opération." },
        { type: "PLUS (Zone U)", amount: "1 000 €", condition: "Par logement (Zone Urbaine)." },
        { type: "PLUS (Passif)", amount: "+ 3 000 €", condition: "Bonus performance Passive." },
        { type: "PLUS (T2 40%)", amount: "+ 1 000 €", condition: "Si 40% de T2 dans l'opération." },
        { type: "PLUS (Vertueux)", amount: "+ 1 500 €", condition: "Matériaux biosourcés." },
        { type: "PLUS AA", amount: "+ 1 500 €", condition: "Uniquement si Vertueux." },
        { type: "PLS (Passif)", amount: "+ 1 000 €", condition: "Bonus performance Passive." },
        { type: "PLS (T2 40%)", amount: "+ 1 000 €", condition: "Si 40% de T2 dans l'opération." },
        { type: "PLS (Vertueux)", amount: "+ 1 500 €", condition: "Matériaux biosourcés." }
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
        { type: "PLAI / PLUS", amount: "3 000 €", condition: "Neuf (Maing/Hergnies uniquement)." },
        { type: "PLAI AA", amount: "0 €", condition: "Si Prix Revient < 2500€." },
        { type: "PLUS AA", amount: "15 000 €", condition: "Si PR > 2500€ + 10% Fonds Propres." },
        { type: "PLUS AA", amount: "30 000 €", condition: "Si PR > 2500€ + 20% Fonds Propres." },
        { type: "PLUS AA (Max)", amount: "40 000 €", condition: "Si PR + 20% FP + Analyse Cycle Vie." },
        { type: "PLS AA", amount: "0 €", condition: "Non cumulable." },
        { type: "PSLA", amount: "Max 30 000 €", condition: "Groupe 3 + TVA 5.5%." },
        { type: "Habitat inclusif", amount: "1 000 €", condition: "Aide conjointe EPCI + CD." }
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

const CAD_DEF = { ...CUD_DEF, id: 'cad', name: "Douaisis Agglo (CAD)",
    subsidiesState: CUD_DEF.subsidiesState,
    subsidiesEPCI: [
        { type: "PLAI", amount: "3 000 €", condition: "Par logement." },
        { type: "PLAI (Petits)", amount: "+ 5 000 €", condition: "Typologie Studio / T1 / T2." },
        { type: "PLAI (GDV)", amount: "+ 5 000 €", condition: "Gens du Voyage." },
        { type: "PLAI Adapté", amount: "5 000 €", condition: "Cumulable avec PLAI classique." },
        { type: "PLUS", amount: "3 000 €", condition: "Maing/Hergnies uniquement." },
        { type: "PLAI AA", amount: "5 000 €", condition: "Cumulable avec PLAI classique." },
        { type: "PSLA", amount: "5 000 €", condition: "Prix Vente max 2000€/m²." },
        { type: "Accession", amount: "5 000 €", condition: "Prix Vente max 2250€/m²." },
        { type: "Habitat inclusif", amount: "1 000 €", condition: "Aide EPCI." }
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

const CAMVS_DEF = { ...CUD_DEF, id: 'camvs', name: "Maubeuge Val de Sambre (CAMVS)",
    subsidiesState: CUD_DEF.subsidiesState,
    subsidiesEPCI: [{ type: "Aide", amount: "Variable", condition: "Selon délibération en vigueur." }],
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

/**
 * ==========================================
 * 3. SERVICES & LOGIQUE
 * ==========================================
 */

const parseCurrency = (v) => { 
    if(!v || typeof v !== 'string') return 0;
    const m = v.match(/(\d+)/g); return m ? Math.max(...m.map(n => parseInt(n))) : 0; 
};

const formatCurrency = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const getMarginValue = (marginStr, zoneRental) => {
    if (!marginStr || typeof marginStr !== 'string' || !marginStr.includes("Z")) return marginStr || "";
    const z = zoneRental ? zoneRental.toString() : "";
    if (z === "2" && marginStr.includes("Z2:")) return marginStr.match(/Z2:([^|]+)/)?.[1] || marginStr;
    if (z === "3" && marginStr.includes("Z3:")) return marginStr.match(/Z3:([^|]+)/)?.[1] || marginStr;
    return marginStr.replace("Z2:", "Z2: ").replace("|Z3:", " | Z3: ");
};

const getRefIdFromEpci = (epciName) => {
    const n = (epciName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
    if (n.includes("lille") && n.includes("metropole")) return 'mel'; 
    if (n.includes("dunkerque")) return 'cud';
    if (n.includes("porte du hainaut")) return 'caph';
    if (n.includes("douaisis") || n.includes("douai")) return 'cad';
    if (n.includes("valenciennes") || n.includes("cavm")) return 'cavm';
    if (n.includes("sambre") || n.includes("maubeuge")) return 'camvs';
    return 'ddtm';
};

const getCommunesCollection = () => collection(db, ...PUBLIC_DATA_PATH); 
const getRefsCollection = () => collection(db, ...REFS_DATA_PATH); 

const fetchAllCommunes = async () => {
  try { 
      const snap = await getDocs(getCommunesCollection()); 
      if (snap.empty) throw new Error("DB empty");
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
  } catch (error) { 
      console.warn("Mode secours: Utilisation des données locales.");
      // EN CAS D'ERREUR DB, on retourne la liste manuelle
      return MANUAL_OVERRIDES;
  }
};

const fetchReferenceData = async (epciId) => {
    try {
        const refDoc = await getDoc(doc(db, ...REFS_DATA_PATH, epciId));
        if (refDoc.exists()) return refDoc.data();
    } catch (e) { }
    const local = ALL_REFS_DEF.find(r => r.id === epciId);
    return local || null;
};

const saveCommuneToDb = async (commune) => {
  try {
    const docId = commune.insee;
    const docRef = doc(db, ...PUBLIC_DATA_PATH, docId);
    const dataToSave = { ...commune };
    if ('isApiSource' in dataToSave) delete dataToSave.isApiSource;
    await setDoc(docRef, { ...dataToSave, lastUpdated: new Date().toLocaleDateString('fr-FR') });
    return true;
  } catch (err) { return false; }
};

const deleteCommuneFromDb = async (insee) => {
    try { 
        await deleteDoc(doc(db, ...PUBLIC_DATA_PATH, insee)); return true; 
    } catch { return false; }
}

const searchGeoApi = async (term) => {
    if (term.length < 2) return [];
    try {
        const response = await fetch(`https://geo.api.gouv.fr/communes?codeDepartement=59&nom=${term}&fields=nom,code,population,epci&boost=population&limit=10`);
        const data = await response.json();
        return data.map((item) => {
            // Check for manual override first
            const manual = MANUAL_OVERRIDES.find(m => m.insee === item.code);
            if (manual) return { ...manual, epci: item.epci?.nom || manual.epci, isApiSource: false };

            const epciName = item.epci ? item.epci.nom : "Non renseigné";
            let autoDT = "À définir";
            const n = epciName.toLowerCase();
            // Simplified DT Logic for display
            if (n.includes("lille")) autoDT = "Territoire Métropole";
            else if (n.includes("dunkerque") || n.includes("flandre")) autoDT = "Territoire Flandre";
            else if (n.includes("valenciennes") || n.includes("hainaut") || n.includes("douaisis") || n.includes("cambrai") || n.includes("sambre")) autoDT = "Territoire Hainaut";
            else autoDT = "DDTM - Service Territorial";
            
            return {
                insee: item.code, name: item.nom, population: item.population, epci: epciName, directionTerritoriale: autoDT,
                stats: null, // Pas de donnée = Pas d'affichage
                zoning: null, // Pas de donnée = Pas d'affichage
                isApiSource: true
            };
        });
    } catch { return []; }
};

const seedDatabase = async () => {
    // Disabled heavy seed to prevent offline errors and blocking
    console.log("Seed disabled for performance/offline stability.");
    return true;
};

/**
 * ==========================================
 * 4. COMPOSANTS (UI)
 * ==========================================
 */

const AdminCommuneEditor = ({ onClose, initialData }) => {
  const [communes, setCommunes] = useState(initialData);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const filteredData = useMemo(() => {
    if (!search) return communes;
    const lower = search.toLowerCase();
    return communes.filter(c => c.name.toLowerCase().includes(lower) || c.insee.includes(lower));
  }, [communes, search]);

  const handleEdit = (c) => { setEditingId(c.insee); setEditForm({ ...c }); };
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
  
  const handleFormChange = (f, v, n) => {
      setEditForm(prev => {
        if (!prev) return null;
        if (n) {
            return { ...prev, [n]: { ...prev[n], [f]: v } };
        }
        return { ...prev, [f]: v };
    });
  };

  const handleDelete = async (insee) => {
      if(confirm("Supprimer définitivement cette commune ?")) {
          const success = await deleteCommuneFromDb(insee);
          if(success) {
              setCommunes(prev => prev.filter(c => c.insee !== insee));
          }
      }
  };

  const handleCreate = () => {
      const newCommune = {
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
                                <td className="p-2"><span className="bg-gray-100 px-1 rounded">{c.zoning?.accession || '-'} / {c.zoning?.rental || '-'}</span></td>
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

const AdminLogin = ({ onLogin, onLogout, isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
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

// --- HELPER COMPONENT POUR LES CARTES D'AIDES ---
const AidCard = ({ title, icon: Icon, color, data }) => {
    if (!data || data.length === 0) return null;
    
    // Définitions de couleurs pour les thèmes
    const themes = {
        yellow: { border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700', amount: 'text-yellow-900' },
        green: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700', amount: 'text-emerald-900' },
        blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', amount: 'text-blue-900' },
        red: { border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700', amount: 'text-rose-900' }
    };
    
    const t = themes[color] || themes.yellow;

    return (
        <div className={`rounded-xl border ${t.border} bg-white overflow-hidden shadow-sm h-full`}>
            <div className={`px-4 py-3 ${t.bg} border-b ${t.border} flex items-center gap-2`}>
                <Icon className={`w-4 h-4 ${t.text}`} />
                <h4 className={`font-bold text-sm ${t.text} uppercase tracking-wide`}>{title}</h4>
            </div>
            <div className="divide-y divide-slate-100">
                {data.map((item, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-700 text-sm">{item.type}</span>
                            <span className={`font-mono font-bold ${t.amount} text-sm`}>{item.amount}</span>
                        </div>
                        {item.condition && (
                            <span className={`text-[11px] text-slate-500 italic block mt-1`}>
                                {item.condition}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const Dashboard = ({ data, isAdmin }) => {
    const [refData, setRefData] = useState(null);
    const [loadingRef, setLoadingRef] = useState(true);

    useEffect(() => {
        const loadRefs = async () => {
            setLoadingRef(true);
            const refId = getRefIdFromEpci(data.epci);
            const rData = await fetchReferenceData(refId);
            setRefData(rData);
            setLoadingRef(false);
        };
        loadRefs();
    }, [data]);

    return (
        <div className="space-y-6">
            {/* Header Card with Zoning INCLUDED */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
                {/* Top Row: Identity */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {data.name} 
                            {data.isApiSource && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">API</span>}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><MapPin size={14}/> {data.insee}</span>
                            <span className="flex items-center gap-1"><Building2 size={14}/> {data.epci || "EPCI Inconnu"}</span>
                            <span className="flex items-center gap-1"><Users size={14}/> {data.population?.toLocaleString()} hab.</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-right border border-slate-200">
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Direction Territoriale</div>
                        <div className="font-semibold text-slate-800">{data.directionTerritoriale || "Non affecté"}</div>
                    </div>
                </div>

                {/* Second Row: Zoning (En haut, prominent) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
                    <div className="bg-purple-50 p-3 rounded-xl flex items-center justify-between border border-purple-100 shadow-sm">
                        <div className="text-sm text-purple-900 font-medium">Zone Locative</div>
                        <div className="text-2xl font-bold text-purple-700">{data.zoning?.rental || "N/A"}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl flex items-center justify-between border border-blue-100 shadow-sm">
                        <div className="text-sm text-blue-900 font-medium">Zone Accession</div>
                        <div className="text-2xl font-bold text-blue-700">{data.zoning?.accession || "N/A"}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Column */}
                <div className="lg:col-span-1 space-y-6">
                    {data.stats ? (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Activity className="text-blue-500" size={20}/> Situation SRU
                            </h3>
                            
                            <div className="relative pt-4 pb-8 flex flex-col items-center">
                                {/* Gauge Visualization */}
                                <div className="relative w-40 h-20 overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full bg-slate-100 rounded-t-full"></div>
                                    <div 
                                        className={`absolute top-0 left-0 w-full h-full rounded-t-full transition-all duration-1000 origin-bottom ${data.stats.socialHousingRate >= data.stats.targetRate ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                        style={{ transform: `rotate(${(Math.min(data.stats.socialHousingRate / 40, 1) * 180) - 180}deg)` }}
                                    ></div>
                                </div>
                                <div className="absolute top-16 font-bold text-3xl text-slate-900">{data.stats.socialHousingRate}%</div>
                                <div className="mt-2 text-xs text-slate-400 text-center">Taux LLS actuel</div>
                            </div>

                            <div className="space-y-4 mt-4">
                                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                    <span className="text-slate-500">Objectif Triennal</span>
                                    <span className="font-semibold">{data.stats.targetRate}%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                    <span className="text-slate-500">Statut Carence</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${data.stats.deficit ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {data.stats.deficit ? 'Déficitaire' : 'Conforme'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col items-center justify-center text-center">
                            <Activity className="text-slate-300 mb-4" size={48}/>
                            <h3 className="text-slate-500 font-bold">Données SRU non disponibles</h3>
                            <p className="text-xs text-slate-400 mt-2 px-4">Ces données n'ont pas encore été renseignées pour cette commune.</p>
                        </div>
                    )}
                </div>

                {/* Reference Data Column */}
                <div className="lg:col-span-2 space-y-6">
                    {loadingRef ? (
                        <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
                            <Loader2 className="animate-spin mx-auto mb-2" /> Chargement du référentiel...
                        </div>
                    ) : refData ? (
                        <>
                            {/* --- NOUVELLE GRILLE D'AIDES --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AidCard title="Aides État" icon={Landmark} color="yellow" data={refData.subsidiesState} />
                                <AidCard title="Aides EPCI" icon={Building2} color="green" data={refData.subsidiesEPCI} />
                                <AidCard title="Département" icon={MapPin} color="blue" data={refData.subsidiesCD} />
                                <AidCard title="ANRU / NPNRU" icon={Home} color="red" data={refData.subsidiesNPNRU} />
                            </div>

                            {/* Detailed Tables */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-700">
                                    <Euro size={18}/> Marges & Loyers Accessoires
                                </div>
                                <div className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-3 font-semibold">Type</th>
                                                    <th className="px-6 py-3 font-semibold">Produit</th>
                                                    <th className="px-6 py-3 font-semibold text-right">Valeur</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {refData.marginsRE2020?.map((m, i) => (
                                                    <tr key={`re-${i}`} className="hover:bg-slate-50 transition-colors even:bg-slate-50/30">
                                                        <td className="px-6 py-3 font-medium text-slate-700">{m.type}</td>
                                                        <td className="px-6 py-3 text-slate-500">
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{m.product}</span>
                                                        </td>
                                                        <td className="px-6 py-3 text-right font-mono text-blue-600 font-bold">
                                                            {getMarginValue(m.margin, data.zoning?.rental)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {refData.accessoryRents?.map((r, i) => (
                                                    <tr key={`rent-${i}`} className="hover:bg-slate-50 transition-colors even:bg-slate-50/30">
                                                        <td className="px-6 py-3 font-medium text-slate-700">{r.type}</td>
                                                        <td className="px-6 py-3 text-slate-500">
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{r.product}</span>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-mono text-emerald-600 font-bold">{r.maxRent}</span>
                                                                {r.condition && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 mt-1">{r.condition}</span>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl p-8 text-center border border-red-100">
                            <ShieldAlert className="mx-auto text-red-400 mb-2" size={32} />
                            <h3 className="text-red-900 font-bold">Référentiel Non Trouvé</h3>
                            <p className="text-red-600 text-sm">Aucune donnée financière disponible pour l'EPCI : {data.epci}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- APP MAIN ---

const App = () => {
  const [viewState, setViewState] = useState(ViewState.HOME);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [allCommunes, setAllCommunes] = useState(MANUAL_OVERRIDES); 
  const [dbError, setDbError] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // AUTH SETUP - MUST USE THIS PATTERN
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth Failed:", error);
        setDbError(`Erreur d'authentification : ${error.code} - ${error.message}`);
      }
    };
    initAuth();
    
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
      if(user) {
          // Au démarrage, on tente de charger les communes
          fetchAllCommunes().then(res => {
              // Si on n'a que les overrides (ou moins), c'est signe qu'il faut seeder
              if (res.length <= MANUAL_OVERRIDES.length + 10) {
                  console.log("Base incomplète, lancement du seed...");
                  setIsSeeding(true);
                  seedDatabase().then(() => {
                      setTimeout(() => setIsSeeding(false), 3000); // UI DISPARAIT APRES 3 SECONDES
                      fetchAllCommunes().then(setAllCommunes);
                  });
              } else {
                  setAllCommunes(res);
              }
          });
      }
  }, [user]);

  useEffect(() => {
    const search = async () => {
        if (searchTerm.length < 2) { setSuggestions([]); return; }
        setLoading(true);
        // Recherche locale d'abord
        const localMatches = allCommunes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
        
        // Si on a assez de résultats locaux, on les utilise (évite les appels API inutiles si DB pleine)
        if (localMatches.length >= 5) {
            setSuggestions(localMatches);
            setLoading(false);
            return;
        }

        // Sinon fallback API (utile si offline/seed incomplet)
        let apiRes = [];
        try {
           if (navigator.onLine) apiRes = await searchGeoApi(searchTerm);
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

        {isSeeding && (
            <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-bounce">
                <RefreshCw className="animate-spin" />
                <div>
                    <p className="font-bold text-sm">Mise à jour de la base...</p>
                    <p className="text-xs opacity-80">Importation des 648 communes</p>
                </div>
            </div>
        )}

        {viewState === ViewState.HOME && (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center mt-12">
             <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-100 max-w-2xl">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Référentiel Habitat <span className="text-blue-600">Nord (59)</span></h1>
                <p className="text-slate-500 mb-8">Base de données complète avec édition des référentiels en ligne.</p>
                {isAdmin && <div className="text-green-600 font-bold text-sm bg-green-50 p-2 rounded border border-green-200">Mode Administrateur Actif</div>}
                
                <div className="mt-8 grid grid-cols-2 gap-4 text-left">
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 font-bold text-slate-700 mb-1"><Target size={16}/> Objectifs SRU</div>
                        <p className="text-xs text-slate-500">Consultez les taux et les objectifs triennaux par commune.</p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 font-bold text-slate-700 mb-1"><Euro size={16}/> Financements</div>
                        <p className="text-xs text-slate-500">Accédez aux subventions délégataires et marges techniques.</p>
                     </div>
                </div>
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
