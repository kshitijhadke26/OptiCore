import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fragment, useMemo, useState } from "react";

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function timesFromMax(maxPerDay:number, collegeStartTime: string = "09:00", collegeEndTime: string = "17:00", sessionDuration: number = 60, recessBreaks: RecessBreak[] = []){
  // Generate comprehensive time slots for optimal timetable coverage
  const startHour = parseInt(collegeStartTime.split(':')[0]);
  const startMinute = parseInt(collegeStartTime.split(':')[1]);
  const endHour = parseInt(collegeEndTime.split(':')[0]);
  const endMinute = parseInt(collegeEndTime.split(':')[1]);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  const allSlots: string[] = [];
  
  // Always include mandatory recess break (01:00 PM–01:30 PM)
  const mandatoryRecess = { start: "13:00", end: "13:30" };
  const recessStart = 13 * 60; // 13:00 in minutes
  const recessEnd = 13 * 60 + 30; // 13:30 in minutes
  
  // Generate morning slots (before recess)
  let currentTime = startTime;
  while (currentTime + sessionDuration <= recessStart) {
    const startH = Math.floor(currentTime / 60);
    const startM = currentTime % 60;
    const endT = currentTime + sessionDuration;
    const endH = Math.floor(endT / 60);
    const endM = endT % 60;
    
    const timeSlot = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}-${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    allSlots.push(timeSlot);
    currentTime += sessionDuration;
  }
  
  // Add mandatory recess break
  allSlots.push(`${mandatoryRecess.start}-${mandatoryRecess.end}`);
  
  // Generate afternoon slots (after recess)
  currentTime = recessEnd;
  while (currentTime + sessionDuration <= endTime) {
    const startH = Math.floor(currentTime / 60);
    const startM = currentTime % 60;
    const endT = currentTime + sessionDuration;
    const endH = Math.floor(endT / 60);
    const endM = endT % 60;
    
    const timeSlot = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}-${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    allSlots.push(timeSlot);
    currentTime += sessionDuration;
  }
  
  // Add configured additional recess breaks if any
  recessBreaks.forEach(recess => {
    if (recess.selectedDays && recess.selectedDays.length > 0) {
      const additionalRecess = `${recess.start}-${recess.end}`;
      if (!allSlots.includes(additionalRecess) && additionalRecess !== `${mandatoryRecess.start}-${mandatoryRecess.end}`) {
        allSlots.push(additionalRecess);
      }
    }
  });
  
  // Sort all slots chronologically
  const sortedSlots = allSlots.sort((a, b) => {
    const [aStart] = a.split('-');
    const [bStart] = b.split('-');
    const [aHour, aMin] = aStart.split(':').map(Number);
    const [bHour, bMin] = bStart.split(':').map(Number);
    const aTime = aHour * 60 + aMin;
    const bTime = bHour * 60 + bMin;
    return aTime - bTime;
  });
  
  console.log('Generated time slots:', sortedSlots);
  return sortedSlots.length > 0 ? sortedSlots : ["09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30"];
}

type Subject = { name: string; perWeek: number; perDay?: number; facultyCount?: number; type?: 'Lecture'|'Practical'; sessionLength?: number; facultyNames?: string[]; manualRooms?: string[]; requiresLab?: boolean; };

type FixedSlot = { subject: string; selectedDays: string[]; time?: string; allDay?: boolean; room?: string; batch?: number };

type RecessBreak = { selectedDays: string[]; start: string; end: string };

type Config = {
  year: string;
  classrooms: number;
  batches: number;
  subjects: Subject[];
  maxPerDay: number;
  avgFacultyLeaves: number;
  fixedSlots: FixedSlot[];
  recess: RecessBreak[];
  collegeStartTime: string;
  collegeEndTime: string;
  sessionDuration: number;
};

type Slot = { subject: string; room: string; batch: number; faculty?: string; subjectType?: 'Lecture'|'Practical'; };

function loadConfig(year: string): Config | null {
  try { const raw = localStorage.getItem(`adminTTConfig:${year}`); return raw? JSON.parse(raw): null; } catch { return null; }
}

function randomInt(n:number){ return Math.floor(Math.random()*n); }

function generatePlan(cfg: Config, seed:number){
  let rand = seed;
  const rng = ()=>{ rand = (rand * 9301 + 49297) % 233280; return rand / 233280; };
  const rint = (n:number)=> Math.floor(rng()*n);

  // Generate times considering college timing and recess breaks
  const recessForAllDays = cfg.recess || [];
  const times = timesFromMax(
    cfg.maxPerDay, 
    cfg.collegeStartTime || "09:00", 
    cfg.collegeEndTime || "17:00", 
    cfg.sessionDuration || 60, 
    recessForAllDays
  );
  const plan: Record<string, Slot[]> = {};

  // Enhanced conflict tracking - declare first
  const roomConflicts: Record<string, Set<string>> = {}; // key -> set of rooms used
  const facultyConflicts: Record<string, Set<string>> = {}; // key -> set of faculty used
  const batchConflicts: Record<string, Set<number>> = {}; // key -> set of batches used

  // Add mandatory recess break for all days (01:00 PM–01:30 PM) - STRICT BLOCKING
  const mandatoryRecessSlot = "13:00-13:30";
  for (const day of days) {
    const key = `${day}-${mandatoryRecessSlot}`;
    plan[key] = [{ subject: "RECESS BREAK", room: "ALL", batch: 0, subjectType: undefined }];
    // Also block in conflict tracking
    roomConflicts[key] = new Set(["ALL"]);
    batchConflicts[key] = new Set([0]);
    facultyConflicts[key] = new Set(["RECESS"]);
  }
  
  // Add configured recess breaks to the plan as blocked slots for each day they're configured
  for (const recess of recessForAllDays) {
    const recessSlot = `${recess.start}-${recess.end}`;
    // Skip if this is the mandatory recess (already added)
    if (recessSlot === mandatoryRecessSlot) continue;
    
    // Add recess breaks for each selected day
    for (const day of recess.selectedDays || []) {
      const key = `${day}-${recessSlot}`;
      plan[key] = [{ subject: "RECESS BREAK", room: "ALL", batch: 0, subjectType: undefined }];
    }
  }

  const assign = (day:string, time:string, slot: Slot)=>{
    const key = `${day}-${time}`; plan[key] ||= [];
    plan[key].push(slot);
  };

  const checkConflicts = (day: string, time: string, room: string, batch: number, faculty?: string, subject?: string, subjectType?: string): boolean => {
    const key = `${day}-${time}`;
    const existingSlots = plan[key] || [];
    
    // STRICT: No classes can be scheduled during recess breaks
    if (existingSlots.some(slot => slot.subject === "RECESS BREAK")) {
      return true; // Block any scheduling during recess
    }
    
    // CRITICAL: Complete separation of lectures and practicals
    const hasLectures = existingSlots.some(slot => slot.subjectType === 'Lecture' && slot.subject !== "RECESS BREAK");
    const hasPracticals = existingSlots.some(slot => slot.subjectType === 'Practical' && slot.subject !== "RECESS BREAK");
    
    if (subjectType === 'Lecture' && hasPracticals) {
      return true; // Cannot schedule lecture when practicals exist
    }
    if (subjectType === 'Practical' && hasLectures) {
      return true; // Cannot schedule practical when lectures exist
    }
    
    // Check room conflicts - NO room sharing allowed
    if (room !== "ALL" && roomConflicts[key]?.has(room)) {
      return true; // Strict room conflict prevention
    }
    
    // Enhanced batch conflict checking
    if (batch > 0) {
      // Check if this specific batch is already scheduled
      if (batchConflicts[key]?.has(batch)) return true;
      
      // Prevent same subject being scheduled for different batches at same time
      if (subject) {
        const sameSubjectSlots = existingSlots.filter(slot => slot.subject === subject && slot.subject !== "RECESS BREAK");
        if (sameSubjectSlots.length > 0) return true;
      }
    } else if (batch === 0) {
      // For lectures (batch 0), check if any individual batch is already scheduled
      const hasIndividualBatches = existingSlots.some(slot => slot.batch > 0 && slot.subject !== "RECESS BREAK");
      if (hasIndividualBatches) return true;
      
      // Check if any other lecture is already scheduled in this slot
      const hasOtherLectures = existingSlots.some(slot => slot.batch === 0 && slot.subject !== "RECESS BREAK" && slot.subject !== subject);
      if (hasOtherLectures) return true;
    }
    
    // Check faculty conflicts
    if (faculty && facultyConflicts[key]?.has(faculty)) return true;
    
    return false;
  };

  const recordAssignment = (day: string, time: string, room: string, batch: number, faculty?: string) => {
    const key = `${day}-${time}`;
    roomConflicts[key] = roomConflicts[key] || new Set();
    batchConflicts[key] = batchConflicts[key] || new Set();
    facultyConflicts[key] = facultyConflicts[key] || new Set();
    
    roomConflicts[key].add(room);
    batchConflicts[key].add(batch);
    if (faculty) facultyConflicts[key].add(faculty);
  };

  // place fixed slots first (but not during recess)
  for (const f of cfg.fixedSlots){
    if (!f.subject || !f.selectedDays || f.selectedDays.length === 0) continue;
    const batch = f.batch && f.batch>=1 && f.batch<=cfg.batches? f.batch : 1;
    const room = f.room || String(100 + rint(cfg.classrooms));
    for (const d of f.selectedDays){
      if (f.allDay){
        for (const t of times){ 
          // Skip recess break slots
          if (t.includes('13:00-13:30') || t === '13:00-13:30') continue;
          if (!checkConflicts(d, t, room, batch)) {
            assign(d, t, { subject: f.subject, room, batch });
            recordAssignment(d, t, room, batch);
          }
        }
      } else if (f.time){
        // Skip if trying to schedule during recess
        if (f.time.includes('13:00-13:30') || f.time === '13:00-13:30') continue;
        if (!checkConflicts(d, f.time, room, batch)) {
          assign(d, f.time, { subject: f.subject, room, batch });
          recordAssignment(d, f.time, room, batch);
        }
      }
    }
  }

  // per batch schedule matrix: day -> count
  const perDayCount: Record<number, Record<string, number>> = {};
  for (let b=1;b<=cfg.batches;b++){ perDayCount[b] = {}; days.forEach(d=> perDayCount[b][d] = 0); }

  // helper: find next available (day,time) for a batch respecting per day max
  function findSlot(batch:number){
    const orderDays = [...days].sort(()=> rng()-0.5);
    for (const d of orderDays){
      if (perDayCount[batch][d] >= cfg.maxPerDay) continue;
      const shuffled = [...times].filter(t => !t.includes('13:00-13:30')).sort(()=> rng()-0.5);
      for (const t of shuffled){
        const key = `${d}-${t}`;
        const used = plan[key]?.filter(s=> s.batch===batch && s.subject !== "RECESS BREAK").length || 0;
        if (used===0) return { d, t };
      }
    }
    return null;
  }

  function findDoubleSlot(batch:number){
    const orderDays = [...days].sort(()=> rng()-0.5);
    for (const d of orderDays){
      if (perDayCount[batch][d] >= cfg.maxPerDay) continue;
      const nonRecessTimes = times.filter(t => !t.includes('13:00-13:30'));
      for (let i=0;i<nonRecessTimes.length-1;i++){
        const t1 = nonRecessTimes[i], t2 = nonRecessTimes[i+1];
        const k1 = `${d}-${t1}`; const k2 = `${d}-${t2}`;
        const u1 = plan[k1]?.filter(s=> s.batch===batch && s.subject !== "RECESS BREAK").length || 0;
        const u2 = plan[k2]?.filter(s=> s.batch===batch && s.subject !== "RECESS BREAK").length || 0;
        if (u1===0 && u2===0) return { d, t1, t2 };
      }
    }
    return null;
  }

  // PHASE 1: Schedule ALL LECTURES first (complete separation)
  const lectureSubjects = cfg.subjects.filter(s => s.type === 'Lecture');
  const practicalSubjects = cfg.subjects.filter(s => s.type === 'Practical');
  
  console.log('Scheduling lectures first...');
  console.log(`Found ${lectureSubjects.length} lecture subjects:`, lectureSubjects.map(s => `${s.name} (${s.perWeek} per week)`));
  
  for (const subj of lectureSubjects) {
    // Calculate optimal sessions per week based on available slots
    const availableSlots = times.filter(t => !t.includes('13:00-13:30')).length;
    const totalSlotsPerWeek = availableSlots * days.length;
    const optimalSessions = Math.max(3, Math.min(6, (subj.perWeek as number)|0));
    
    let remaining = optimalSessions;
    const facultyList = subj.facultyNames || [];
    
    let sessionCount = remaining;
    let dayAllocs: Record<string, number> = {}; 
    days.forEach(d=> dayAllocs[d]=0);
    
    console.log(`Scheduling ${sessionCount} sessions for ${subj.name} (optimal distribution)`);
    
    // Priority-based scheduling: distribute evenly across all days first
    const maxPerDay = Math.ceil(sessionCount / days.length);
    
    while (sessionCount > 0) {
      let scheduled = false;
      
      // Find days with minimum allocations first for even distribution
      const sortedDays = [...days].sort((a, b) => {
        const aCount = dayAllocs[a];
        const bCount = dayAllocs[b];
        if (aCount !== bCount) return aCount - bCount;
        return rng() - 0.5; // Random tiebreaker
      });
      
      for (const day of sortedDays) {
        if (dayAllocs[day] >= maxPerDay) continue;
        
        // Get available time slots (excluding recess)
        const availableTimes = times.filter(t => !t.includes('13:00-13:30'));
        
        // Try to find an empty slot first, then any available slot
        const emptySlots = availableTimes.filter(time => {
          const key = `${day}-${time}`;
          const existingSlots = plan[key] || [];
          return existingSlots.length === 0;
        });
        
        const slotsToTry = emptySlots.length > 0 ? emptySlots : availableTimes;
        const shuffledTimes = [...slotsToTry].sort(() => rng() - 0.5);
        
        for (const time of shuffledTimes) {
          // Auto-assign room for lectures
          const assignedRoom = String(100 + rint(cfg.classrooms));
          
          // Select faculty if available
          const assignedFaculty = facultyList.length > 0 ? 
            facultyList[rint(facultyList.length)] : undefined;
          
          // Check if slot is completely free (no conflicts)
          if (checkConflicts(day, time, assignedRoom, 0, assignedFaculty, subj.name, 'Lecture')) continue;
          
          // Schedule the lecture
          const slotData: Slot = {
            subject: subj.name,
            room: assignedRoom,
            batch: 0, // All batches for lectures
            faculty: assignedFaculty,
            subjectType: 'Lecture'
          };
          
          assign(day, time, slotData);
          recordAssignment(day, time, assignedRoom, 0, assignedFaculty);
          dayAllocs[day]++;
          sessionCount--;
          scheduled = true;
          console.log(`Scheduled ${subj.name} on ${day} at ${time} (${dayAllocs[day]}/${maxPerDay} for this day)`);
          break;
        }
        if (scheduled) break;
      }
      
      // If couldn't schedule with current constraints, try with relaxed constraints
      if (!scheduled && sessionCount > 0) {
        console.log(`Relaxing constraints for ${subj.name}, remaining: ${sessionCount}`);
        
        // Try any day with available slots
        for (const day of days) {
          if (dayAllocs[day] >= (subj.perDay || 3)) continue;
          
          const availableTimes = times.filter(t => !t.includes('13:00-13:30'));
          
          for (const time of availableTimes) {
            const assignedRoom = String(100 + rint(cfg.classrooms));
            const assignedFaculty = facultyList.length > 0 ? 
              facultyList[rint(facultyList.length)] : undefined;
            
            if (checkConflicts(day, time, assignedRoom, 0, assignedFaculty, subj.name, 'Lecture')) continue;
            
            const slotData: Slot = {
              subject: subj.name,
              room: assignedRoom,
              batch: 0,
              faculty: assignedFaculty,
              subjectType: 'Lecture'
            };
            
            assign(day, time, slotData);
            recordAssignment(day, time, assignedRoom, 0, assignedFaculty);
            dayAllocs[day]++;
            sessionCount--;
            scheduled = true;
            console.log(`Scheduled ${subj.name} on ${day} at ${time} (relaxed constraints)`);
            break;
          }
          if (scheduled) break;
        }
      }
      
      // If still couldn't schedule, break to avoid infinite loop
      if (!scheduled) {
        console.warn(`Could not schedule remaining sessions for lecture: ${subj.name}. Remaining: ${sessionCount}`);
        break;
      }
    }
    
    console.log(`Final allocation for ${subj.name}:`, dayAllocs);
  }
  
  console.log('Scheduling practicals second...');
  console.log(`Found ${practicalSubjects.length} practical subjects:`, practicalSubjects.map(s => `${s.name} (${s.perWeek} per week)`));
  
  // PHASE 2: Schedule ALL PRACTICALS after lectures (complete separation)
  for (const subj of practicalSubjects) {
    // Calculate optimal sessions per week for practicals
    const optimalSessions = Math.max(2, Math.min(4, (subj.perWeek as number)|0));
    let remaining = optimalSessions;
    const facultyList = subj.facultyNames || [];
    const manualRooms = subj.manualRooms || [];
    const dur = subj.sessionLength || 120;
    
    console.log(`Scheduling practical ${subj.name} with ${remaining} sessions per batch (optimal distribution)`);
    
    // Split into individual batches for practicals
    const batchesToSchedule = Array.from({length: cfg.batches}, (_, i) => i + 1);
    
    for (const targetBatch of batchesToSchedule) {
      let sessionCount = remaining;
      let dayAllocs: Record<string, number> = {}; 
      days.forEach(d=> dayAllocs[d]=0);
      
      console.log(`Scheduling ${sessionCount} sessions for ${subj.name} - Batch ${targetBatch}`);
      
      // Priority-based scheduling for practicals: spread across days
      const maxPerDay = Math.ceil(sessionCount / days.length);
      
      while (sessionCount > 0) {
        let scheduled = false;
        
        // Find days with minimum allocations first for even distribution
        const sortedDays = [...days].sort((a, b) => {
          const aCount = dayAllocs[a] + perDayCount[targetBatch][a];
          const bCount = dayAllocs[b] + perDayCount[targetBatch][b];
          if (aCount !== bCount) return aCount - bCount;
          return rng() - 0.5; // Random tiebreaker
        });
        
        for (const day of sortedDays) {
          if (dayAllocs[day] >= (subj.perDay || 1)) continue;
          if (perDayCount[targetBatch][day] >= cfg.maxPerDay) continue;
          
          // Get available time slots (excluding recess) and shuffle them
          const availableTimes = times.filter(t => !t.includes('13:00-13:30'));
          const shuffledTimes = [...availableTimes].sort(() => rng() - 0.5);
          
          for (let timeIdx = 0; timeIdx < shuffledTimes.length; timeIdx++) {
            const time = shuffledTimes[timeIdx];
            
            // For 2-hour sessions, check if next slot is also available
            const nextTimeIdx = availableTimes.indexOf(time) + 1;
            const nextTime = dur === 120 && nextTimeIdx < availableTimes.length ? availableTimes[nextTimeIdx] : null;
            
            // Use manual room assignment for practicals
            let assignedRoom: string;
            if (manualRooms.length > 0) {
              const roomIndex = (targetBatch - 1) % manualRooms.length;
              assignedRoom = manualRooms[roomIndex];
            } else {
              assignedRoom = String(200 + rint(cfg.classrooms)); // Different range for practicals
            }
            
            // Select faculty if available
            const assignedFaculty = facultyList.length > 0 ? 
              facultyList[rint(facultyList.length)] : undefined;
            
            // Check conflicts for main slot
            if (checkConflicts(day, time, assignedRoom, targetBatch, assignedFaculty, subj.name, 'Practical')) continue;
            
            // Check conflicts for second slot if 2-hour session
            if (nextTime && checkConflicts(day, nextTime, assignedRoom, targetBatch, assignedFaculty, subj.name, 'Practical')) continue;
            
            // Schedule the session(s)
            const slotData: Slot = {
              subject: subj.name,
              room: assignedRoom,
              batch: targetBatch,
              faculty: assignedFaculty,
              subjectType: 'Practical'
            };
            
            assign(day, time, slotData);
            recordAssignment(day, time, assignedRoom, targetBatch, assignedFaculty);
            
            if (nextTime) {
              assign(day, nextTime, slotData);
              recordAssignment(day, nextTime, assignedRoom, targetBatch, assignedFaculty);
              perDayCount[targetBatch][day] += 2;
              dayAllocs[day] += 2;
              console.log(`Scheduled ${subj.name} (Batch ${targetBatch}) on ${day} at ${time}-${nextTime} (2-hour session)`);
            } else {
              perDayCount[targetBatch][day]++;
              dayAllocs[day]++;
              console.log(`Scheduled ${subj.name} (Batch ${targetBatch}) on ${day} at ${time}`);
            }
            
            sessionCount--;
            scheduled = true;
            break;
          }
          if (scheduled) break;
        }
        
        // If couldn't schedule, break to avoid infinite loop
        if (!scheduled) {
          console.warn(`Could not schedule all sessions for practical: ${subj.name}, batch: ${targetBatch}. Remaining: ${sessionCount}`);
          break;
        }
      }
      
      console.log(`Final allocation for ${subj.name} - Batch ${targetBatch}:`, dayAllocs);
    }
  }

  // PHASE 3: Fill remaining empty slots with additional sessions for optimal utilization
  console.log('Optimizing timetable by filling empty slots...');
  
  const availableNonRecessTimes = times.filter(t => !t.includes('13:00-13:30'));
  let emptySlots = 0;
  let filledSlots = 0;
  
  // Count empty slots
  for (const day of days) {
    for (const time of availableNonRecessTimes) {
      const key = `${day}-${time}`;
      const existingSlots = plan[key] || [];
      const nonRecessSlots = existingSlots.filter(slot => slot.subject !== "RECESS BREAK");
      if (nonRecessSlots.length === 0) {
        emptySlots++;
      }
    }
  }
  
  console.log(`Found ${emptySlots} empty slots to optimize`);
  
  // Try to fill empty slots with additional lectures
  if (emptySlots > 0 && lectureSubjects.length > 0) {
    for (const day of days) {
      for (const time of availableNonRecessTimes) {
        const key = `${day}-${time}`;
        const existingSlots = plan[key] || [];
        const nonRecessSlots = existingSlots.filter(slot => slot.subject !== "RECESS BREAK");
        
        if (nonRecessSlots.length === 0 && filledSlots < Math.min(emptySlots, lectureSubjects.length * 2)) {
          // Try to add an additional lecture session
          const subj = lectureSubjects[filledSlots % lectureSubjects.length];
          const assignedRoom = String(100 + rint(cfg.classrooms));
          const facultyList = subj.facultyNames || [];
          const assignedFaculty = facultyList.length > 0 ? 
            facultyList[rint(facultyList.length)] : undefined;
          
          // Check if we can add this without conflicts
          if (!checkConflicts(day, time, assignedRoom, 0, assignedFaculty, subj.name, 'Lecture')) {
            const slotData: Slot = {
              subject: subj.name,
              room: assignedRoom,
              batch: 0,
              faculty: assignedFaculty,
              subjectType: 'Lecture'
            };
            
            assign(day, time, slotData);
            recordAssignment(day, time, assignedRoom, 0, assignedFaculty);
            filledSlots++;
            console.log(`Filled empty slot: ${subj.name} on ${day} at ${time}`);
          }
        }
      }
    }
  }
  
  console.log(`Optimization complete: Filled ${filledSlots} additional slots`);
  console.log(`Final timetable utilization: ${((availableNonRecessTimes.length * days.length - emptySlots + filledSlots) / (availableNonRecessTimes.length * days.length) * 100).toFixed(1)}%`);

  return { times, plan };
}

function detectConflicts(cfg: Config, times:string[], plan: Record<string, Slot[]>) {
  const issues: string[] = [];
  
  for (const d of days){
    for (const t of times){
      const key = `${d}-${t}`;
      const slots = plan[key] || [];
      
      // Skip recess break slots completely
      if (t.includes('13:00-13:30') || t === '13:00-13:30') {
        // Check if there are any non-recess items during recess
        const nonRecessSlots = slots.filter(slot => slot.subject !== "RECESS BREAK");
        if (nonRecessSlots.length > 0) {
          const subjects = nonRecessSlots.map(s => s.subject).join(', ');
          issues.push(`Classes scheduled during recess break at ${d} ${t}: ${subjects}`);
        }
        continue;
      }
      
      const nonRecessSlots = slots.filter(slot => slot.subject !== "RECESS BREAK");
      if (nonRecessSlots.length === 0) continue;
      
      // Room conflicts - check for duplicate room assignments
      const roomUsage = new Map<string, Slot[]>();
      const facultyUsage = new Map<string, Slot[]>();
      const batchUsage = new Map<number, Slot[]>();
      const subjectBatchUsage = new Map<string, Set<number>>();
      
      for (const slot of nonRecessSlots) {
        // Track room usage (except for lectures which can share rooms)
        if (slot.room !== "ALL") {
          if (!roomUsage.has(slot.room)) roomUsage.set(slot.room, []);
          roomUsage.get(slot.room)!.push(slot);
        }
        
        // Track faculty usage
        if (slot.faculty) {
          if (!facultyUsage.has(slot.faculty)) facultyUsage.set(slot.faculty, []);
          facultyUsage.get(slot.faculty)!.push(slot);
        }
        
        // Track batch usage
        if (slot.batch >= 0) {
          if (!batchUsage.has(slot.batch)) batchUsage.set(slot.batch, []);
          batchUsage.get(slot.batch)!.push(slot);
        }
        
        // Track subject-batch combinations to prevent same subject different batches
        if (!subjectBatchUsage.has(slot.subject)) subjectBatchUsage.set(slot.subject, new Set());
        subjectBatchUsage.get(slot.subject)!.add(slot.batch);
      }
      
      // Check room conflicts (allow lectures to share rooms)
      for (const [room, roomSlots] of roomUsage) {
        if (roomSlots.length > 1) {
          // Allow room sharing only if all slots are lectures (batch 0)
          const allLectures = roomSlots.every(slot => slot.batch === 0);
          if (!allLectures) {
            const subjects = roomSlots.map(s => `${s.subject}(${s.subjectType || 'Unknown'})`).join(', ');
            issues.push(`Room ${room} conflict at ${d} ${t}: ${subjects}`);
          }
        }
      }
      
      // Check faculty conflicts
      for (const [faculty, facultySlots] of facultyUsage) {
        if (facultySlots.length > 1) {
          const subjects = facultySlots.map(s => `${s.subject}(${s.subjectType || 'Unknown'})`).join(', ');
          issues.push(`Faculty ${faculty} conflict at ${d} ${t}: ${subjects}`);
        }
      }
      
      // Check batch conflicts
      for (const [batch, batchSlots] of batchUsage) {
        if (batchSlots.length > 1) {
          const subjects = batchSlots.map(s => `${s.subject}(${s.subjectType || 'Unknown'})`).join(', ');
          issues.push(`Batch ${batch} conflict at ${d} ${t}: ${subjects}`);
        }
      }
      
      // Check same subject different batch conflicts
      for (const [subject, batches] of subjectBatchUsage) {
        if (batches.size > 1) {
          const batchList = Array.from(batches).map(b => b === 0 ? 'Lecture' : `Practical-B${b}`).join(', ');
          issues.push(`Subject "${subject}" scheduled for multiple batches at ${d} ${t}: ${batchList}`);
        }
      }
      
      // CRITICAL: Check lecture vs practical conflicts (should NEVER happen)
      const lectureSlots = nonRecessSlots.filter(s => s.subjectType === 'Lecture');
      const practicalSlots = nonRecessSlots.filter(s => s.subjectType === 'Practical');
      if (lectureSlots.length > 0 && practicalSlots.length > 0) {
        const lectureNames = lectureSlots.map(s => s.subject).join(', ');
        const practicalNames = practicalSlots.map(s => s.subject).join(', ');
        issues.push(`CRITICAL: Lecture and practical mixed at ${d} ${t} - Lectures: ${lectureNames}, Practicals: ${practicalNames}`);
      }
      
      // Check for multiple lectures in same slot
      if (lectureSlots.length > 1) {
        const subjects = lectureSlots.map(s => s.subject).join(', ');
        issues.push(`Multiple lectures at ${d} ${t}: ${subjects}`);
      }
      
      // Check if total room usage exceeds available classrooms (for auto-assigned rooms)
      const autoAssignedRooms = nonRecessSlots.filter(s => s.room.match(/^\d+$/)).length;
      if (autoAssignedRooms > cfg.classrooms) {
        issues.push(`Insufficient classrooms at ${d} ${t} (need ${autoAssignedRooms}, have ${cfg.classrooms})`);
      }
    }
  }
  
  return Array.from(new Set(issues));
}

export default function AdminGenerateTimetable(){
  const [year, setYear] = useState("1");
  const [results, setResults] = useState<{ id:string; times:string[]; plan:Record<string, Slot[]>; conflicts:string[] }[]>([]);
  const [fullScreenView, setFullScreenView] = useState<{ data: any; index: number } | null>(null);

  const cfg = useMemo(()=> loadConfig(year), [year]);

  function generate(){
    const conf = loadConfig(year);
    if (!conf){ alert("No configuration for selected year. Please import data first."); return; }
    
    console.log('Generating conflict-free timetables...');
    const variants = [];
    
    // Generate multiple attempts to find conflict-free solutions
    for (let i = 1; i <= 5; i++) {
      const res = generatePlan(conf, i*100 + Math.floor(Math.random()*100));
      const conflicts = detectConflicts(conf, res.times, res.plan);
      
      console.log(`Plan ${i}: ${conflicts.length} conflicts`);
      if (conflicts.length > 0) {
        console.log('Conflicts:', conflicts);
      }
      
      variants.push({ id: `${Date.now()}-${i}`, times: res.times, plan: res.plan, conflicts });
      
      // If we found a conflict-free solution, prioritize it
      if (conflicts.length === 0) {
        console.log(`Found conflict-free solution: Plan ${i}`);
      }
    }
    
    // Sort by conflict count (conflict-free first)
    variants.sort((a, b) => a.conflicts.length - b.conflicts.length);
    
    setResults(variants.slice(0, 3)); // Show top 3 results
  }

  function sendToHOD(resIndex:number){
    const item = results[resIndex];
    const submission = { id: item.id, year, createdAt: Date.now(), status: 'sent', times: item.times, plan: item.plan, conflicts: item.conflicts };
    const raw = localStorage.getItem('ttSubmissions');
    const arr = raw? JSON.parse(raw): [];
    arr.unshift(submission);
    localStorage.setItem('ttSubmissions', JSON.stringify(arr));
    alert('Sent to HOD for approval');
  }

  function openFullScreenView(data: any, index: number) {
    setFullScreenView({ data, index });
  }

  function closeFullScreenView() {
    setFullScreenView(null);
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Generate Timetable</h1>
            <p className="text-muted-foreground">Create optimized timetables with smart batch handling and conflict detection</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Year</span>
            <select className="border rounded-md px-2 py-1" value={year} onChange={(e)=>setYear(e.target.value)}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
            <Button onClick={generate} className="bg-[#079E74] hover:bg-[#068d67] text-white">Generate</Button>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {results.map((r, idx)=> (
            <Card key={r.id} className={r.conflicts.length===0? 'ring-2 ring-emerald-500':''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Plan {String.fromCharCode(65+idx)}</CardTitle>
                <div className={`text-xs font-medium ${r.conflicts.length? 'text-red-600':'text-emerald-600'}`}>
                  {r.conflicts.length? `${r.conflicts.length} conflicts detected` : 'Conflict-free'}
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Only use time slots that contain ranges (have '-' and are not single times)
                  const timeRangeSlots = r.times.filter(time => 
                    time.includes('-') && time.includes(':') && 
                    time.split('-').length === 2 && 
                    time.split('-')[1].includes(':')
                  );
                  
                  // Sort time slots chronologically for proper flow
                  const sortedTimes = timeRangeSlots.sort((a, b) => {
                    const [aStart] = a.split('-');
                    const [bStart] = b.split('-');
                    const [aHour, aMin] = aStart.split(':').map(Number);
                    const [bHour, bMin] = bStart.split(':').map(Number);
                    const aTime = aHour * 60 + aMin;
                    const bTime = bHour * 60 + bMin;
                    return aTime - bTime;
                  });
                  
                  return (
                    <div className="overflow-x-auto">
                      <div className="grid" style={{ gridTemplateColumns: `100px repeat(${sortedTimes.length}, 1fr)` }}>
                        {/* Header row with time slots */}
                        <div className="text-[11px] p-1 font-medium">Day</div>
                        {sortedTimes.map(t => (
                          <div key={t} className="text-[11px] p-1 text-center font-medium border-b">
                            {t}
                          </div>
                        ))}
                        
                        {/* Rows for each day */}
                        {days.map((d) => (
                          <Fragment key={d}>
                            <div className="text-[11px] p-1 border-r font-medium bg-gray-50">{d}</div>
                            {sortedTimes.map((t) => {
                              const key = `${d}-${t}`;
                              const vals = r.plan[key] || [];
                              
                              // Check if this is a recess break time slot
                              const isRecessTime = t.includes('13:00-13:30') || t === '13:00-13:30';
                              
                              // For recess time, ONLY show recess break
                              const displayVals = isRecessTime ? 
                                [{ subject: "RECESS BREAK", room: "ALL", batch: 0 }] : 
                                vals.filter(v => v.subject !== "RECESS BREAK");
                              
                              return (
                                <div key={key} className={`p-1 border ${isRecessTime ? 'bg-orange-100 border-orange-300' : displayVals.length? (displayVals.some(v => v.subjectType === 'Practical') ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'):''}}`}>
                                  <div className="text-[11px] space-y-1">
                                    {displayVals.map((v,i)=> (
                                      <div key={i} className={isRecessTime ? 'text-orange-700 font-medium' : (v.subjectType === 'Practical' ? 'text-green-700' : 'text-blue-700')}>
                                        {v.subject === "RECESS BREAK" ? "🍽️" : (
                                          <div className="space-y-0.5">
                                            <div className="font-medium flex items-center gap-1">
                                              {v.subjectType === 'Practical' ? '🧪' : '📚'}
                                              <span className="text-xs">{v.subjectType === 'Practical' ? 'P' : 'L'}</span>
                                            </div>
                                            <div className="text-[9px]">
                                              {v.subject}
                                            </div>
                                            <div className="text-[8px] text-muted-foreground">
                                              R-{v.room}
                                              {v.subjectType === 'Practical' ? ` B${v.batch}` : ''}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" onClick={()=>openFullScreenView(r, idx)}>View</Button>
                  <Button variant="outline" onClick={()=>sendToHOD(idx)}>Send to HOD</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Screen Timetable Modal */}
        {fullScreenView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Timetable - Plan {String.fromCharCode(65+fullScreenView.index)}</h2>
                  <div className={`text-sm font-medium ${fullScreenView.data.conflicts.length? 'text-red-600':'text-emerald-600'}`}>
                    {fullScreenView.data.conflicts.length? `${fullScreenView.data.conflicts.length} conflicts detected` : 'Conflict-free'}
                  </div>
                </div>
                <Button variant="outline" onClick={closeFullScreenView}>Close</Button>
              </div>
              
              <div className="p-6">
                {(() => {
                  // Only use time slots that contain ranges (have '-' and are not single times)
                  const timeRangeSlots = fullScreenView.data.times.filter((time: string) => 
                    time.includes('-') && time.includes(':') && 
                    time.split('-').length === 2 && 
                    time.split('-')[1].includes(':')
                  );
                  
                  // Sort time slots chronologically for proper flow
                  const sortedTimes = timeRangeSlots.sort((a: string, b: string) => {
                    const [aStart] = a.split('-');
                    const [bStart] = b.split('-');
                    const [aHour, aMin] = aStart.split(':').map(Number);
                    const [bHour, bMin] = bStart.split(':').map(Number);
                    const aTime = aHour * 60 + aMin;
                    const bTime = bHour * 60 + bMin;
                    return aTime - bTime;
                  });
                  
                  return (
                    <div className="overflow-x-auto">
                      <div className="grid" style={{ gridTemplateColumns: `120px repeat(${sortedTimes.length}, 1fr)` }}>
                        {/* Header row with time slots */}
                        <div className="text-sm p-2 font-medium bg-gray-100 border">Day</div>
                        {sortedTimes.map((t: string) => (
                          <div key={t} className="text-sm p-2 text-center font-medium bg-gray-100 border">
                            {t}
                          </div>
                        ))}
                        
                        {/* Rows for each day */}
                        {days.map((d) => (
                          <Fragment key={d}>
                            <div className="text-sm p-2 font-medium bg-gray-50 border">{d}</div>
                            {sortedTimes.map((t: string) => {
                              const key = `${d}-${t}`;
                              const vals = fullScreenView.data.plan[key] || [];
                              
                              // Check if this is a recess break time slot
                              const isRecessTime = t.includes('13:00-13:30') || t === '13:00-13:30';
                              
                              // For recess time, ONLY show recess break
                              const displayVals = isRecessTime ? 
                                [{ subject: "RECESS BREAK", room: "ALL", batch: 0 }] : 
                                vals.filter((v: any) => v.subject !== "RECESS BREAK");
                              
                              return (
                                <div key={key} className={`p-2 border min-h-[100px] ${isRecessTime ? 'bg-orange-100 border-orange-300' : displayVals.length? (displayVals.some((v: any) => v.subjectType === 'Practical') ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'):''}}`}>
                                  <div className="text-sm space-y-2">
                                    {displayVals.map((v: any, i: number) => (
                                      <div key={i} className={`p-2 rounded ${isRecessTime ? 'text-orange-700 font-medium bg-orange-200' : (v.subjectType === 'Practical' ? 'text-green-700 bg-green-100' : 'text-blue-700 bg-blue-100')}`}>
                                        {v.subject === "RECESS BREAK" ? "🍽️ RECESS BREAK" : (
                                          <div className="space-y-1">
                                            <div className="font-medium flex items-center gap-2">
                                              {v.subjectType === 'Practical' ? '🧪' : '📚'}
                                              <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-70">{v.subjectType === 'Practical' ? 'PRACTICAL' : 'LECTURE'}</span>
                                              <span className="font-semibold">{v.subject}</span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              <div>Room: {v.room}</div>
                                              {v.subjectType === 'Practical' && <div>Batch: {v.batch}</div>}
                                              {v.faculty && <div>Faculty: {v.faculty}</div>}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Conflicts Display */}
                {fullScreenView.data.conflicts.length > 0 && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-medium text-red-800 mb-2">Conflicts Detected:</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      {fullScreenView.data.conflicts.map((conflict: string, i: number) => (
                        <li key={i}>• {conflict}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
