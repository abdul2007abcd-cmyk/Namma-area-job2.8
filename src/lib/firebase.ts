/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query,
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { Job } from '../types';
import { SEED_JOBS } from '../data/seedJobs';

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyB5Xfo22PMygvV6WxSI2V724PI3SbAFl0Y",
  authDomain: "gen-lang-client-0130502121.firebaseapp.com",
  projectId: "gen-lang-client-0130502121",
  storageBucket: "gen-lang-client-0130502121.firebasestorage.app",
  messagingSenderId: "1054093091783",
  appId: "1:1054093091783:web:6bde3c145bc2a918c9efe2"
};

const databaseId = "ai-studio-nammaareajob-05319ed3-edf1-43e5-a29a-0235d544d3f2";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the custom database ID
const db = initializeFirestore(app, {}, databaseId);

const JOBS_COLLECTION = 'jobs';

/**
 * Normalizes a firestore document to a Job type.
 */
function docToJob(id: string, data: any): Job {
  return {
    id,
    businessName: data.businessName || '',
    role: data.role || '',
    category: data.category || '',
    salary: data.salary || '',
    location: data.location || '',
    area: data.area || '',
    contactNumber: data.contactNumber || '',
    description: data.description || '',
    postedAt: data.postedAt || new Date().toISOString(),
    isCustom: data.isCustom ?? false,
  };
}

/**
 * Fetches all jobs from Firestore. If the database is empty, seeds it with SEED_JOBS first.
 */
export async function getJobsFromFirestore(): Promise<Job[]> {
  try {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const snapshot = await getDocs(jobsRef);
    
    if (snapshot.empty) {
      console.log('Firestore is empty. Seeding default Chennai jobs...');
      await seedDefaultJobs();
      // Fetch again after seeding
      const seededSnapshot = await getDocs(jobsRef);
      return seededSnapshot.docs.map(doc => docToJob(doc.id, doc.data()));
    }
    
    return snapshot.docs.map(doc => docToJob(doc.id, doc.data()));
  } catch (error) {
    console.error('Error fetching jobs from Firestore:', error);
    // Fallback to local seeds
    return SEED_JOBS;
  }
}

/**
 * Seeds the database with default SEED_JOBS.
 */
async function seedDefaultJobs() {
  const batch = writeBatch(db);
  const jobsRef = collection(db, JOBS_COLLECTION);
  
  for (const job of SEED_JOBS) {
    const docRef = doc(jobsRef, job.id);
    batch.set(docRef, {
      businessName: job.businessName,
      role: job.role,
      category: job.category,
      salary: job.salary,
      location: job.location,
      area: job.area,
      contactNumber: job.contactNumber,
      description: job.description,
      postedAt: job.postedAt,
      isCustom: false
    });
  }
  
  await batch.commit();
  console.log('Seeding completed successfully!');
}

/**
 * Adds a new job post to Firestore.
 */
export async function addJobToFirestore(job: Omit<Job, 'id' | 'postedAt' | 'isCustom'>): Promise<Job> {
  const jobsRef = collection(db, JOBS_COLLECTION);
  const docRef = await addDoc(jobsRef, {
    ...job,
    postedAt: new Date().toISOString(),
    isCustom: true
  });
  
  return {
    ...job,
    id: docRef.id,
    postedAt: new Date().toISOString(),
    isCustom: true
  };
}

/**
 * Deletes a job from Firestore by its ID.
 */
export async function deleteJobFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, JOBS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Automatically deletes custom job posts older than 7 days from Firestore.
 */
export async function cleanOldCustomJobs(): Promise<void> {
  try {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    const snapshot = await getDocs(jobsRef);
    for (const d of snapshot.docs) {
      const data = d.data();
      if (data.isCustom) {
        const postedTime = new Date(data.postedAt).getTime();
        if (now - postedTime > sevenDaysInMs) {
          console.log(`Deleting expired job post: ${d.id}`);
          await deleteDoc(doc(db, JOBS_COLLECTION, d.id));
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired jobs:', error);
  }
}
