import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, MapPin, Building2, Users, AlertTriangle, 
  CheckCircle, Save, Database, Loader2, Plus, Trash2, Lock, Unlock, 
  X, Calculator, ChevronUp, CheckSquare, Square, 
  Landmark, BadgeCheck, MapPinned, Target, Download, FileText, Edit3, ShieldAlert, Activity,
  Euro, Info, WifiOff, Briefcase, Home, RefreshCw, Layers, CloudUpload
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

// Corrections manuelles COMPLÈTES (Noms DT simplifiés : "Hainaut - Douaisis - Cambrésis", "Métropole", etc.)
const MANUAL_OVERRIDES = [
  // VALENCIENNOIS (CAVM / CAPH)
  { insee: "59221", name: "Famars", population: 2500, epci: "CA Valenciennes Métropole", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 10.6, targetRate: 20, deficit: true } },
  { insee: "59606", name: "Valenciennes", population: 42990, epci: "CA Valenciennes Métropole", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 28.0, targetRate: 20, deficit: false } },
  { insee: "59526", name: "Saint-Amand-les-Eaux", population: 16000, epci: "CA de la Porte du Hainaut", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 19.0, targetRate: 20, deficit: false } },
  
  // METROPOLE LILLOISE (MEL)
  { insee: "59017", name: "Armentières", population: 24800, epci: "Métropole Européenne de Lille", directionTerritoriale: "Métropole", zoning: { accession: "B1", rental: "2" }, stats: { socialHousingRate: 23.0, targetRate: 25, deficit: true } }, 
  { insee: "59350", name: "Lille", population: 236000, epci: "Métropole Européenne de Lille", directionTerritoriale: "Métropole", zoning: { accession: "A", rental: "1" }, stats: { socialHousingRate: 24.5, targetRate: 25, deficit: true } },
  { insee: "59512", name: "Roubaix", population: 98000, epci: "Métropole Européenne de Lille", directionTerritoriale: "Métropole", zoning: { accession: "B1", rental: "1" }, stats: { socialHousingRate: 45.2, targetRate: 25, deficit: false } },
  { insee: "59599", name: "Tourcoing", population: 99000, epci: "Métropole Européenne de Lille", directionTerritoriale: "Métropole", zoning: { accession: "B1", rental: "1" }, stats: { socialHousingRate: 32.1, targetRate: 25, deficit: false } },
  { insee: "59648", name: "Villeneuve-d'Ascq", population: 62000, epci: "Métropole Européenne de Lille", directionTerritoriale: "Métropole", zoning: { accession: "B1", rental: "1" }, stats: { socialHousingRate: 42.0, targetRate: 25, deficit: false } },
  { insee: "59368", name: "Marcq-en-Barœul", population: 38500, epci: "Métropole Européenne de Lille", directionTerritoriale: "Métropole", zoning: { accession: "A", rental: "1" }, stats: { socialHousingRate: 19.4, targetRate: 25, deficit: true } },
  { insee: "59457", name: "Pérenchies", population: 8500, epci: "Métropole Européenne de Lille", directionTerritoriale: "Métropole", zoning: { accession: "B1", rental: "2" }, stats: { socialHousingRate: 17.8, targetRate: 25, deficit: true } }, 

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
  { insee: "59654", name: "Waziers", population: 7400, epci: "Douaisis Agglo", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: null }, // Ajout Waziers sans stats inventées
  { insee: "59392", name: "Maubeuge", population: 29000, epci: "CA Maubeuge Val de Sambre", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 40.0, targetRate: 20, deficit: false } },
  { insee: "59122", name: "Cambrai", population: 31000, epci: "CA de Cambrai", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "C", rental: "3" }, stats: { socialHousingRate: 22.0, targetRate: 20, deficit: false } },
  { insee: "59225", name: "Feignies", population: 6800, epci: "CA Maubeuge Val de Sambre", directionTerritoriale: "Hainaut - Douaisis - Cambrésis", zoning: { accession: "B2", rental: "2" }, stats: { socialHousingRate: 17.0, targetRate: 20, deficit: false } }
];

// Référentiels Financiers
const DDTM_DEF = {
    id: 'ddtm', name: 'DDTM 59 (Droit Commun)', lastUpdated: '01/01/2024',
    subsidiesState: [{ type: "PLAI", amount: "13 500 €", condition: "/lgt" }, { type: "PLUS", amount: "5 400 €", condition: "/lgt" }],
    subsidiesCD: [{ type: "CD PLAI", amount: "4 000 €", condition: "Forfait" }, { type: "CD PLUS", amount: "2 000 €", condition: "Forfait" }],
    subsidiesNPNRU: [{ type: "ANRU", amount: "Variable", condition: "Selon conv." }],
    marginsRE2020: [{ type: "Marge", product: "Tous", margin: "Selon perf" }],
    marginsDivers: [{ type: "Marge", product: "Tous", margin: "Selon perf" }],
    accessoryRents: [{ type: "Garage", product: "Annexes", maxRent: "60.45 €", condition: "Zone B1/B2" }],
    hasMargins: true, hasRents: true
};

// ... MEL_DEF, CUD_DEF, CAPH_DEF, CAVM_DEF, CAMVS_DEF (identiques à avant pour économiser de la place, sauf corrections noms si besoin)
// Je remets les définitions complètes pour être sûr

const MEL_DEF = {
    ...DDTM_DEF, id: 'mel', name: 'Métropole Européenne de Lille (MEL)', lastUpdated: 'Juillet 2025',
    subsidiesState: [
        { type: "PLAI DC / AA", amount: "9 130 €", condition: "Socle de base par logement." },
        { type: "PLAI Adapté (Ord)", amount: "16 480 €", condition: "Opérations de 1 à 3 logements." },
        { type: "PLAI Adapté (Str)", amount: "8 980 €", condition: "Opérations en structure collective." },
        { type: "PLAI - AA Superbonus", amount: "26 000 €", condition: "Acquisition-Amélioration (Plafond)." },
        { type: "PLAI - AA Mégabonus", amount: "40 000 €", condition: "Acquisition-Amélioration (Très social)." },
        { type: "PLUS - AA Mégabonus", amount: "16 000 €", condition: "Acquisition-Amélioration (Spécifique)." },
        { type: "Résidences Sociales", amount: "7 500 €", condition: "Supplément au socle adapté." }
    ],
    subsidiesEPCI: [
        { type: "PLAI Neuf/AA", amount: "15 000 €", condition: "Par logement (Socle MEL)." },
        { type: "PLAI (<10 lgts)", amount: "26 000 €", condition: "Opérations de moins de 10 logements." },
        { type: "PLAI AA (Plafond)", amount: "26 000 €", condition: "Acquisition-Amélioration." },
        { type: "PLAI Structure", amount: "12k€ - 15k€", condition: "Selon surface utile (< ou > 50m²)." },
        { type: "Octave Construction", amount: "7 500 €", condition: "Logement label Octave (Neuf)." },
        { type: "Octave Réhabilitation", amount: "4 000 €", condition: "Logement label Octave (Réhab)." },
        { type: "PLAI Adapté", amount: "16 480 €", condition: "Alignement sur socle État." },
        { type: "Fonds Friches", amount: "Sur dossier", condition: "Appel à projet annuel." },
        { type: "Désamiantage", amount: "50% Coût HT", condition: "Plafond 10 000 € / lgmt." },
        { type: "Démolition", amount: "50% Coût HT", condition: "Plafond 15 000 € / lgmt." }
    ],
    subsidiesNPNRU: [
        { type: "Subv. PLAI", amount: "6 300 + 1 500 €", condition: "Doublé si Acquisition-Amélioration." },
        { type: "Prêt PLAI", amount: "7 900 + 1 900 €", condition: "Doublé si Acquisition-Amélioration." },
        { type: "Prêt PLUS", amount: "6 700 + 5 600 €", condition: "Doublé si Acquisition-Amélioration." },
        { type: "Démolition", amount: "100%", condition: "Prise en charge intégrale si conventionné." }
    ],
    subsidiesCD: [
        { type: "CD PLAI", amount: "27 000 €", condition: "Forfaitaire." },
        { type: "CD PLAI Adapté", amount: "33 250 €", condition: "Forfaitaire." },
        { type: "CD PLUS", amount: "18 000 €", condition: "Forfaitaire." },
        { type: "CD PLS", amount: "4 000 €", condition: "Forfaitaire." }
    ],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "0%" },
        { type: "Bbio -10%", product: "PLUS", margin: "0%" },
        { type: "Cepnr -10%", product: "PLUS", margin: "0%" }
    ],
    marginsDivers: [
        { type: "NF Habitat HQE", product: "PLUS", margin: "0%" },
        { type: "Logt individuel", product: "PLUS", margin: "0%" }
    ],
    accessoryRents: [
        { type: "Garage", product: "PLAI", maxRent: "0 €", condition: "Gratuité obligatoire" },
        { type: "Garage", product: "PLUS", maxRent: "60.45 €", condition: "Plafond mensuel" },
        { type: "Parking Ext.", product: "PLUS", maxRent: "30.00 €", condition: "Valeur de marché" }
    ],
    hasMargins: true, hasRents: true
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
        { type: "PLUS AA Base", amount: "6 000 €", condition: "Conso < 145kWh/m²/an." }
    ],
    subsidiesNPNRU: [
        { type: "Subv. PLAI", amount: "6 300 + 1 500 €", condition: "Doublé si AA." },
        { type: "Prêt PLAI", amount: "7 900 + 1 900 €", condition: "Doublé si AA." },
        { type: "Prêt PLUS", amount: "6 700 + 5 600 €", condition: "Doublé si AA." }
    ],
    subsidiesCD: [
        { type: "CD PLAI", amount: "27 000 €", condition: "Forfaitaire." },
        { type: "CD PLUS", amount: "18 000 €", condition: "Forfaitaire." }
    ],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "Z2:0%|Z3:0%" },
        { type: "Bbio-10%", product: "PLUS", margin: "Z2:5%|Z3:6%" }
    ],
    marginsDivers: [
        { type: "NF Habitat/Presta", product: "PLUS", margin: "0%" },
        { type: "Logt individuel", product: "PLUS", margin: "2%" }
    ],
    accessoryRents: [
        { type: "Garage", product: "PLAI", maxRent: "15.00 €", condition: "Plafond CUD" },
        { type: "Garage", product: "PLUS", maxRent: "60.45 €", condition: "Plafond Zone B2" }
    ],
    hasMargins: true, hasRents: true
};

const CAPH_DEF = { ...CUD_DEF, id: 'caph', name: "Porte du Hainaut (CAPH)",
    subsidiesState: DDTM_DEF.subsidiesState, 
    subsidiesEPCI: [
        { type: "PLAI (Zone U)", amount: "3 000 €", condition: "Par logement (Zone Urbaine)." },
        { type: "PLAI (Passif)", amount: "+ 3 000 €", condition: "Bonus performance Passive." },
        { type: "PLAI AA", amount: "5 000 €", condition: "Plafonné à 25 000€ par opération." },
        { type: "PLUS (Zone U)", amount: "1 000 €", condition: "Par logement (Zone Urbaine)." }
    ],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "0%" }
    ],
    marginsDivers: [
        { type: "NF Habitat/Presta", product: "PLUS", margin: "0%" }
    ],
    accessoryRents: [
        { type: "Garage", product: "PLAI", maxRent: "15.00 €", condition: "Recommandation" },
        { type: "Garage", product: "PLUS", maxRent: "60.45 €", condition: "Plafond Zone B2" }
    ],
};

const CAVM_DEF = { ...CUD_DEF, id: 'cavm', name: "Valenciennes Métropole (CAVM)",
    subsidiesState: [
        { type: "PLAI - DC", amount: "6 452 €", condition: "/lgt" },
        { type: "PLAI Adapté", amount: "16 480 €", condition: "1-3 lgts" },
        { type: "Pensions/RS", amount: "7 500 €", condition: "Suppl. Adapté" }
    ],
    subsidiesEPCI: [
        { type: "Accession Sociale", amount: "30 000 €", condition: "Neuf, PSLA/VEFA, Prix < Plafonds." },
        { type: "PLAI / PLUS", amount: "3 000 €", condition: "Neuf (Maing/Hergnies uniquement)." },
        { type: "PLUS AA", amount: "15k - 40k €", condition: "Variable selon PR, Fonds Propres, ACV." },
        { type: "Habitat inclusif", amount: "1 000 €", condition: "Aide conjointe EPCI + CD." }
    ],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "0%" },
        { type: "Bbio/Cep -10%", product: "PLUS", margin: "5%" }
    ],
    marginsDivers: [
        { type: "NF Habitat/Presta", product: "PLUS", margin: "3%" },
        { type: "Logt individuel", product: "PLUS", margin: "3%" }
    ],
    accessoryRents: [
        { type: "Garage", product: "PLAI", maxRent: "15.00 €", condition: "Plafond" },
        { type: "Garage", product: "PLUS", maxRent: "60.45 €", condition: "Plafond Zone B2" }
    ],
    hasMargins: true, hasRents: true
};

const CAMVS_DEF = { ...CUD_DEF, id: 'camvs', name: "Maubeuge Val de Sambre (CAMVS)",
    subsidiesState: DDTM_DEF.subsidiesState,
    subsidiesEPCI: [{ type: "Aide", amount: "Variable", condition: "Selon délibération en vigueur." }],
    marginsRE2020: [
        { type: "RE2020 Base", product: "PLUS", margin: "0%" },
        { type: "Bbio -10%", product: "PLUS", margin: "6%" },
        { type: "Bbio -20%", product: "PLUS", margin: "8%" }
    ],
    marginsDivers: [
        { type: "NF Habitat", product: "PLUS", margin: "3%" },
        { type: "Indiv/Jardin", product: "PLUS", margin: "3%" }
    ],
    accessoryRents: [
        { type: "Garage", product: "PLAI", maxRent: "0 €", condition: "Gratuité" },
        { type: "Garage", product: "PLUS", maxRent: "60.45 €", condition: "Plafond Zone B2" }
    ],
    hasMargins: true, hasRents: true
};

// --- DOUAISIS AGGLO (CAD) - STRICTEMENT CONFORME AU TABLEAU ---
const CAD_DEF = { 
    id: 'cad', name: "Communauté d'Agglomération du Douaisis (CAD)", lastUpdated: 'Juillet 2025',
    subsidiesState: [
        { type: "PLAI - Droit Commun", amount: "6 452 €", condition: "Par logement" },
        { type: "PLAI Adapté", amount: "16 480 €", condition: "Ordinaire - 1 à 3 lgts" },
        { type: "PLAI Adapté (Structure)", amount: "8 980 €", condition: "En structure" },
        { type: "PLAI - AA", amount: "16 000 €", condition: "Super bonus" },
        { type: "PLUS - AA", amount: "20 000 €", condition: "Mega bonus*" },
        { type: "Pension de familles / RS", amount: "7 500 €", condition: "Subvention supplémentaire au PLAI Adapté Structure" }
    ],
    subsidiesEPCI: [
        { type: "PLAI", amount: "3 000 €", condition: "Par logement" },
        { type: "PLAI (Petits)", amount: "+ 5 000 €", condition: "Petites typologies (Studio, T1, T2)" },
        { type: "PLAI (GDV)", amount: "+ 5 000 €", condition: "Adapté au Gens du Voyage" },
        { type: "PLAI Adapté", amount: "5 000 €", condition: "Peut être couplé aux aides PLAI" },
        { type: "PLUS", amount: "3 000 €", condition: "Logement neuf pour Maing et Hergnies" },
        { type: "PLAI AA", amount: "5 000 €", condition: "Peut être couplé aux aides PLAI" },
        { type: "PSLA", amount: "5 000 €", condition: "PV max 2 000 €/m² TTC" },
        { type: "Accession maitrisé", amount: "5 000 €", condition: "PV max 2 250 €/m² TTC - Contrat avec clause anti-spéculation" },
        { type: "Autre 1 - Habitat inclusif", amount: "1 000 €", condition: "Aide du CD" },
        { type: "Autre 1 - Habitat inclusif (EPCI)", amount: "1 000 €", condition: "Aide EPCI en plus de l'aide du CD" }
    ],
    subsidiesNPNRU: [
        { type: "Subvention PLAI", amount: "6 300 €/lgt + 1 500 €/lgt", condition: "Si AA - Subvention doublé" },
        { type: "Prêt bonifié PLAI", amount: "7 900 €/lgt + 1 900 €/lgt", condition: "Si AA - Subvention doublé" },
        { type: "Prêt bonifié PLUS", amount: "6 700 €/lgt + 5 600 €/lgt", condition: "Si AA - Subvention doublé" }
    ],
    subsidiesCD: [
        { type: "CD PLAI", amount: "27 000 €", condition: "Par logement" },
        { type: "CD PLAI Adapté", amount: "33 250 €", condition: "Fonctionne sur toutes les zones" },
        { type: "CD PLUS", amount: "18 000 €", condition: "Par logement" },
        { type: "CD PLS", amount: "4 000 €", condition: "Par logement" }
    ],
    marginsRE2020: [
        { type: "RE 2020 Base", product: "PLUS", margin: "0%" },
        { type: "Cep-10%", product: "PLUS", margin: "3%" },
        { type: "Energie positive", product: "PLUS", margin: "7%" },
        { type: "RE 2020 - RO NPNRU - Base", product: "PLUS", margin: "0%" },
        { type: "Cep nr et/ou Bbio -10%", product: "PLUS", margin: "5%" },
        { type: "Cep nr et/ou Bbio -20%", product: "PLUS", margin: "7%" },
        { type: "Passif", product: "PLUS", margin: "7%" },
        { type: "Energie positive", product: "PLUS", margin: "7%" },
        { type: "Récupération eaux de pluie...", product: "PLUS", margin: "3%" }
    ],
    marginsDivers: [
        { type: "BBC rénovation 2025 1ère étape", product: "PLAI/PLUS", margin: "4%" },
        { type: "BBC rénovation 2025", product: "PLAI/PLUS", margin: "7%" },
        { type: "Asc. Bât col < R+3", product: "PLUS", margin: "Formule" },
        { type: "Locaux collectifs résidentiels", product: "PLUS", margin: "Formule" },
        { type: "NF Habitat HQE ou Prestaterre BEE+ (a)", product: "", margin: "4%" },
        { type: "Contexte local Zone 3 si RT>RT2012-10%...", product: "PLUS", margin: "+ 1%" },
        { type: "BBC rénovation 2025 1ère étape", product: "PLAI", margin: "3%" },
        { type: "BBC rénovation 2025", product: "PLAI", margin: "6%" },
        { type: "BBC rénovation 2025 - Zone 3", product: "PLAI", margin: "+ 1%" },
        { type: "BBC rénovation 2025 1ère étape", product: "PLUS", margin: "2%" },
        { type: "BBC rénovation 2025", product: "PLUS", margin: "4%" },
        { type: "BBC rénovation 2025 - Zone 3", product: "PLUS", margin: "+ 1%" }
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
    accessoryRentsRO: [
        { type: "Garage", product: "PLAI", maxRent: "0 €", condition: "" },
        { type: "Garage", product: "PLUS", maxRent: "32 €", condition: "" },
        { type: "Garage", product: "PLS", maxRent: "32 €", condition: "" },
        { type: "Carport", product: "PLAI", maxRent: "0 €", condition: "" },
        { type: "Carport", product: "PLUS", maxRent: "25 €", condition: "" },
        { type: "Carport", product: "PLS", maxRent: "25 €", condition: "" },
        { type: "Stationnement", product: "PLAI", maxRent: "0 €", condition: "" },
        { type: "Stationnement", product: "PLUS", maxRent: "16 €", condition: "" },
        { type: "Stationnement", product: "PLS", maxRent: "16 €", condition: "" }
    ],
    hasMargins: true, hasRents: true
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

const searchGeoApi = async (term, currentCommunes) => {
    if (term.length < 2) return [];
    try {
        const response = await fetch(`https://geo.api.gouv.fr/communes?codeDepartement=59&nom=${term}&fields=nom,code,population,epci&boost=population&limit=10`);
        const data = await response.json();
        return data.map((item) => {
            // 1. RECHERCHE DANS LES DONNÉES LOCALES CHARGÉES (Source de vérité)
            const existing = currentCommunes.find(c => c.insee === item.code);
            if (existing) return { ...existing, isApiSource: false };

            // 2. SINON (Nouveau ou pas encore chargé)
            const epciName = item.epci ? item.epci.nom : "Non renseigné";
            let autoDT = "À définir";
            const n = epciName.toLowerCase();
            
            let defaultZoning = null;

            if (n.includes("lille")) {
                autoDT = "Métropole";
                defaultZoning = { accession: "B1", rental: "2" }; // Hypothèse majoritaire MEL
            }
            else if (n.includes("dunkerque") || n.includes("flandre")) {
                autoDT = "Flandre Grand Littoral";
                defaultZoning = { accession: "B2", rental: "2" }; // Hypothèse majoritaire CUD
            }
            else if (n.includes("valenciennes") || n.includes("hainaut") || n.includes("douaisis") || n.includes("cambrai") || n.includes("sambre")) {
                autoDT = "Hainaut - Douaisis - Cambrésis";
                defaultZoning = { accession: "B2", rental: "2" }; // Hypothèse majoritaire Hainaut
            }
            else autoDT = "DDTM";
            
            return {
                insee: item.code, name: item.nom, population: item.population, epci: epciName, directionTerritoriale: autoDT,
                stats: null,
                zoning: defaultZoning, 
                isApiSource: true
            };
        });
    } catch { return []; }
};

const seedDatabase = async () => {
    try {
        console.log("Lancement du SEED (Chargement de toutes les communes)...");
        const response = await fetch('https://geo.api.gouv.fr/communes?codeDepartement=59&fields=nom,code,population,epci');
        const apiCommunes = await response.json();
        
        const allCommunesData = apiCommunes.map(c => {
            const manual = MANUAL_OVERRIDES.find(m => m.insee === c.code);
            const epciName = c.epci ? c.epci.nom : "Non renseigné";
            let autoDT = "À définir";
            const n = epciName.toLowerCase();
            let defaultZoning = null;

            if (n.includes("lille")) {
                autoDT = "Métropole";
                defaultZoning = { accession: "B1", rental: "2" };
            }
            else if (n.includes("dunkerque") || n.includes("flandre")) {
                autoDT = "Flandre Grand Littoral";
                defaultZoning = { accession: "B2", rental: "2" };
            }
            else if (n.includes("valenciennes") || n.includes("hainaut") || n.includes("douaisis") || n.includes("cambrai") || n.includes("sambre")) {
                autoDT = "Hainaut - Douaisis - Cambrésis";
                defaultZoning = { accession: "B2", rental: "2" };
            }
            else autoDT = "DDTM";

            if (manual) {
                return {
                    ...manual,
                    population: c.population,
                    epci: epciName,
                    directionTerritoriale: autoDT,
                    lastUpdated: new Date().toLocaleDateString('fr-FR')
                };
            } else {
                return {
                    insee: c.code,
                    name: c.nom,
                    population: c.population,
                    epci: epciName,
                    directionTerritoriale: autoDT,
                    stats: null,
                    zoning: defaultZoning,
                    lastUpdated: new Date().toLocaleDateString('fr-FR')
                };
            }
        });

        const CHUNK_SIZE = 400; 
        for (let i = 0; i < allCommunesData.length; i += CHUNK_SIZE) {
            const chunk = allCommunesData.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);
            chunk.forEach(c => {
                const docRef = doc(db, ...PUBLIC_DATA_PATH, c.insee);
                batch.set(docRef, c);
            });
            await batch.commit();
        }

        const batchRefs = writeBatch(db);
        ALL_REFS_DEF.forEach((r) => { 
            batchRefs.set(doc(db, ...REFS_DATA_PATH, r.id), r, { merge: true });
        });
        await batchRefs.commit();
        
        console.log("SEED terminé avec succès.");
        return true;
    } catch (e) {
        console.warn("Erreur SEED (Probable problème de droits/offline):", e.message);
        return false;
    }
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

const AdminLogin = ({ onLogin, onLogout, isAdmin, onSeed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [seedStatus, setSeedStatus] = useState(null);

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

  const handleSeed = async () => {
    if(confirm("Attention : Cette opération va écraser les données sur le serveur avec l'API officielle des 648 communes. Êtes-vous sûr ?")) {
        setSeedStatus("loading");
        try {
            await onSeed();
            setSeedStatus("success");
            setTimeout(() => setSeedStatus(null), 3000);
        } catch(e) {
            setSeedStatus("error");
        }
    }
  };

  if (isAdmin) {
    return (
      <div className="flex gap-2">
        <button onClick={handleSeed} className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded hover:bg-orange-100 font-medium transition-colors">
             {seedStatus === "loading" ? <RefreshCw className="w-3 h-3 animate-spin"/> : <CloudUpload className="w-3 h-3" />}
             {seedStatus === "loading" ? "En cours..." : seedStatus === "success" ? "Terminé !" : "Synchroniser Base (648)"}
        </button>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium text-xs px-3 py-1 bg-red-50 rounded transition-colors">
            <Unlock className="w-3 h-3" /> Admin Off
        </button>
      </div>
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
                                <AidCard title="ANRU / NPNRU" icon={Home} color="red" data={refData.subsidiesNPNRU} />
                                <AidCard title="Département" icon={MapPin} color="blue" data={refData.subsidiesCD} />
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
                                                {refData.accessoryRentsRO && refData.accessoryRentsRO.length > 0 && (
                                                    <tr className="bg-slate-100 border-y border-slate-200">
                                                        <td colSpan="3" className="px-6 py-2 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">
                                                            Loyers Accessoires - RO NPNRU
                                                        </td>
                                                    </tr>
                                                )}
                                                {refData.accessoryRentsRO?.map((r, i) => (
                                                    <tr key={`rent-ro-${i}`} className="hover:bg-slate-50 transition-colors even:bg-slate-50/30">
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
          // Au démarrage, on tente de charger les communes depuis la DB
          fetchAllCommunes().then(res => {
              setAllCommunes(res);
          });
      }
  }, [user]);

  useEffect(() => {
    const search = async () => {
        if (searchTerm.length < 2) { setSuggestions([]); return; }
        setLoading(true);
        
        // 1. RECHERCHE LOCALE D'ABORD (Source de Vérité)
        // On cherche dans allCommunes qui contient les données DB + Manuelles
        const localMatches = allCommunes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
        
        // Si on a des résultats locaux, on les utilise EN PRIORITÉ
        // Cela évite que l'API n'écrase les données riches (Zonage, Stats) avec des coquilles vides
        if (localMatches.length > 0) {
            setSuggestions(localMatches);
            setLoading(false);
            return;
        }

        // 2. FALLBACK API (Seulement si inconnu en local)
        let apiRes = [];
        try {
           if (navigator.onLine) apiRes = await searchGeoApi(searchTerm, allCommunes);
        } catch (e) {
           console.warn("API Gouv unavailable", e);
        }

        setSuggestions(apiRes.slice(0, 5));
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
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher une commune..." className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white border focus:border-
