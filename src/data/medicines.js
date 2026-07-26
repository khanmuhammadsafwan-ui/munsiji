// ============================================================
// মুন্সীজি — প্রি-লোডেড ওষুধের সিড ডেটাবেস (বাংলাদেশ)
// b = ব্র্যান্ড, g = জেনেরিক, c = কোম্পানি, s = স্ট্রেংথ, f = ফর্ম
// এটা একটা শুরুর তালিকা — দোকানদার নিজের ওষুধও যোগ করতে পারবে।
// কোনো তথ্য ভুল মনে হলে এই ফাইলেই ঠিক করা যায়।
// ============================================================

export const MEDICINES = [
  // ---------- প্যারাসিটামল ----------
  { b: 'Napa', g: 'Paracetamol', c: 'Beximco', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Napa Extra', g: 'Paracetamol + Caffeine', c: 'Beximco', s: '500mg+65mg', f: 'ট্যাবলেট' },
  { b: 'Napa Extend', g: 'Paracetamol', c: 'Beximco', s: '665mg', f: 'ট্যাবলেট' },
  { b: 'Napa', g: 'Paracetamol', c: 'Beximco', s: '120mg/5ml', f: 'সিরাপ' },
  { b: 'Ace', g: 'Paracetamol', c: 'Square', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Ace Plus', g: 'Paracetamol + Caffeine', c: 'Square', s: '500mg+65mg', f: 'ট্যাবলেট' },
  { b: 'Ace XR', g: 'Paracetamol', c: 'Square', s: '665mg', f: 'ট্যাবলেট' },
  { b: 'Ace', g: 'Paracetamol', c: 'Square', s: '120mg/5ml', f: 'সিরাপ' },
  { b: 'Fast', g: 'Paracetamol', c: 'Acme', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Renova', g: 'Paracetamol', c: 'Opsonin', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Reset', g: 'Paracetamol', c: 'Incepta', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Xcel', g: 'Paracetamol', c: 'ACI', s: '500mg', f: 'ট্যাবলেট' },

  // ---------- গ্যাস্ট্রিক (PPI) ----------
  { b: 'Seclo', g: 'Omeprazole', c: 'Square', s: '20mg', f: 'ক্যাপসুল' },
  { b: 'Seclo', g: 'Omeprazole', c: 'Square', s: '40mg', f: 'ক্যাপসুল' },
  { b: 'Losectil', g: 'Omeprazole', c: 'Eskayef', s: '20mg', f: 'ক্যাপসুল' },
  { b: 'PPI', g: 'Omeprazole', c: 'Opsonin', s: '20mg', f: 'ক্যাপসুল' },
  { b: 'Sergel', g: 'Esomeprazole', c: 'Healthcare', s: '20mg', f: 'ক্যাপসুল' },
  { b: 'Sergel', g: 'Esomeprazole', c: 'Healthcare', s: '40mg', f: 'ক্যাপসুল' },
  { b: 'Maxpro', g: 'Esomeprazole', c: 'Renata', s: '20mg', f: 'ট্যাবলেট' },
  { b: 'Maxpro', g: 'Esomeprazole', c: 'Renata', s: '40mg', f: 'ট্যাবলেট' },
  { b: 'Nexum', g: 'Esomeprazole', c: 'Square', s: '20mg', f: 'ক্যাপসুল' },
  { b: 'Esoral', g: 'Esomeprazole', c: 'Eskayef', s: '20mg', f: 'ক্যাপসুল' },
  { b: 'Exium', g: 'Esomeprazole', c: 'Radiant', s: '20mg', f: 'ক্যাপসুল' },
  { b: 'Esonix', g: 'Esomeprazole', c: 'Incepta', s: '20mg', f: 'ট্যাবলেট' },
  { b: 'Pantonix', g: 'Pantoprazole', c: 'Incepta', s: '20mg', f: 'ট্যাবলেট' },
  { b: 'Finix', g: 'Rabeprazole', c: 'Opsonin', s: '20mg', f: 'ট্যাবলেট' },
  { b: 'Acifix', g: 'Rabeprazole', c: 'Beximco', s: '20mg', f: 'ট্যাবলেট' },
  { b: 'Entacyd Plus', g: 'Antacid', c: 'Square', s: '—', f: 'ট্যাবলেট' },
  { b: 'Entacyd Plus', g: 'Antacid', c: 'Square', s: '—', f: 'সাসপেনশন' },

  // ---------- অ্যালার্জি / অ্যান্টিহিস্টামিন ----------
  { b: 'Alatrol', g: 'Cetirizine', c: 'Square', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Alatrol', g: 'Cetirizine', c: 'Square', s: '5mg/5ml', f: 'সিরাপ' },
  { b: 'Fexo', g: 'Fexofenadine', c: 'Square', s: '120mg', f: 'ট্যাবলেট' },
  { b: 'Fexo', g: 'Fexofenadine', c: 'Square', s: '180mg', f: 'ট্যাবলেট' },
  { b: 'Fenadin', g: 'Fexofenadine', c: 'Renata', s: '120mg', f: 'ট্যাবলেট' },
  { b: 'Axodin', g: 'Fexofenadine', c: 'Aristopharma', s: '120mg', f: 'ট্যাবলেট' },
  { b: 'Telfast', g: 'Fexofenadine', c: 'Sanofi', s: '120mg', f: 'ট্যাবলেট' },
  { b: 'Loratin', g: 'Loratadine', c: 'Square', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Deslor', g: 'Desloratadine', c: 'Square', s: '5mg', f: 'ট্যাবলেট' },
  { b: 'Rupa', g: 'Rupatadine', c: 'Square', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Histacin', g: 'Chlorpheniramine', c: 'Jayson', s: '4mg', f: 'ট্যাবলেট' },
  { b: 'Histacin', g: 'Chlorpheniramine', c: 'Jayson', s: '2mg/5ml', f: 'সিরাপ' },
  { b: 'Tofen', g: 'Ketotifen', c: 'Beximco', s: '1mg', f: 'ট্যাবলেট' },
  { b: 'Tofen', g: 'Ketotifen', c: 'Beximco', s: '1mg/5ml', f: 'সিরাপ' },

  // ---------- মন্টিলুকাস্ট ----------
  { b: 'Monas', g: 'Montelukast', c: 'Acme', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Monas', g: 'Montelukast', c: 'Acme', s: '5mg', f: 'চিবানো ট্যাবলেট' },
  { b: 'Montene', g: 'Montelukast', c: 'Square', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Provair', g: 'Montelukast', c: 'UniMed UniHealth', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Lumona', g: 'Montelukast', c: 'Eskayef', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Trilock', g: 'Montelukast', c: 'Incepta', s: '10mg', f: 'ট্যাবলেট' },

  // ---------- অ্যান্টিবায়োটিক ----------
  { b: 'Zimax', g: 'Azithromycin', c: 'Square', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Zimax', g: 'Azithromycin', c: 'Square', s: '200mg/5ml', f: 'সাসপেনশন' },
  { b: 'Azithrocin', g: 'Azithromycin', c: 'Beximco', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Tridosil', g: 'Azithromycin', c: 'Eskayef', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Moxacil', g: 'Amoxicillin', c: 'Square', s: '500mg', f: 'ক্যাপসুল' },
  { b: 'Fimoxyl', g: 'Amoxicillin', c: 'Synovia', s: '500mg', f: 'ক্যাপসুল' },
  { b: 'Fimoxyclav', g: 'Amoxicillin + Clavulanic Acid', c: 'Synovia', s: '500mg+125mg', f: 'ট্যাবলেট' },
  { b: 'Moxaclav', g: 'Amoxicillin + Clavulanic Acid', c: 'Square', s: '500mg+125mg', f: 'ট্যাবলেট' },
  { b: 'Cef-3', g: 'Cefixime', c: 'Square', s: '200mg', f: 'ক্যাপসুল' },
  { b: 'Cef-3', g: 'Cefixime', c: 'Square', s: '400mg', f: 'ক্যাপসুল' },
  { b: 'Cef-3', g: 'Cefixime', c: 'Square', s: '100mg/5ml', f: 'সাসপেনশন' },
  { b: 'Emixef', g: 'Cefixime', c: 'Drug International', s: '200mg', f: 'ক্যাপসুল' },
  { b: 'T-Cef', g: 'Cefixime', c: 'Aristopharma', s: '200mg', f: 'ক্যাপসুল' },
  { b: 'Cefotil', g: 'Cefuroxime', c: 'Square', s: '250mg', f: 'ট্যাবলেট' },
  { b: 'Cefotil', g: 'Cefuroxime', c: 'Square', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Ceftron', g: 'Ceftriaxone', c: 'Square', s: '1g', f: 'ইনজেকশন' },
  { b: 'Ciprocin', g: 'Ciprofloxacin', c: 'Square', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Neofloxin', g: 'Ciprofloxacin', c: 'Beximco', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Cipro-A', g: 'Ciprofloxacin', c: 'Acme', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Doxicap', g: 'Doxycycline', c: 'Renata', s: '100mg', f: 'ক্যাপসুল' },
  { b: 'Phylopen', g: 'Flucloxacillin', c: 'Beximco', s: '500mg', f: 'ক্যাপসুল' },
  { b: 'Lebac', g: 'Cephradine', c: 'Square', s: '500mg', f: 'ক্যাপসুল' },
  { b: 'Sefril', g: 'Cephradine', c: 'Synovia', s: '500mg', f: 'ক্যাপসুল' },
  { b: 'Amodis', g: 'Metronidazole', c: 'Square', s: '400mg', f: 'ট্যাবলেট' },
  { b: 'Filmet', g: 'Metronidazole', c: 'Beximco', s: '400mg', f: 'ট্যাবলেট' },
  { b: 'Flagyl', g: 'Metronidazole', c: 'Synovia', s: '400mg', f: 'ট্যাবলেট' },

  // ---------- অ্যান্টিফাঙ্গাল / কৃমি ----------
  { b: 'Flugal', g: 'Fluconazole', c: 'Square', s: '50mg', f: 'ক্যাপসুল' },
  { b: 'Flugal', g: 'Fluconazole', c: 'Square', s: '150mg', f: 'ক্যাপসুল' },
  { b: 'Almex', g: 'Albendazole', c: 'Square', s: '400mg', f: 'চিবানো ট্যাবলেট' },
  { b: 'Lorix', g: 'Permethrin', c: 'Opsonin', s: '5%', f: 'ক্রিম' },

  // ---------- পেট / বমি / ডায়রিয়া ----------
  { b: 'Omidon', g: 'Domperidone', c: 'Square', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Omidon', g: 'Domperidone', c: 'Square', s: '5mg/5ml', f: 'সাসপেনশন' },
  { b: 'Don-A', g: 'Domperidone', c: 'Acme', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Emistat', g: 'Ondansetron', c: 'ACI', s: '8mg', f: 'ট্যাবলেট' },
  { b: 'Butapan', g: 'Hyoscine Butylbromide', c: 'Renata', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Imotil', g: 'Loperamide', c: 'Square', s: '2mg', f: 'ক্যাপসুল' },
  { b: 'Orsaline-N', g: 'ORS', c: 'SMC', s: '—', f: 'স্যাশে' },

  // ---------- শ্বাসকষ্ট / কাশি ----------
  { b: 'Sultolin', g: 'Salbutamol', c: 'Square', s: '2mg', f: 'ট্যাবলেট' },
  { b: 'Sultolin', g: 'Salbutamol', c: 'Square', s: '2mg/5ml', f: 'সিরাপ' },
  { b: 'Sultolin', g: 'Salbutamol', c: 'Square', s: '100mcg', f: 'ইনহেলার' },
  { b: 'Azmasol', g: 'Salbutamol', c: 'Beximco', s: '100mcg', f: 'ইনহেলার' },
  { b: 'Brodil', g: 'Salbutamol', c: 'ACI', s: '2mg/5ml', f: 'সিরাপ' },
  { b: 'Purisal', g: 'Levosalbutamol', c: 'UniMed UniHealth', s: '1mg/5ml', f: 'সিরাপ' },
  { b: 'Ticamet', g: 'Salmeterol + Fluticasone', c: 'Square', s: '250mcg', f: 'ইনহেলার' },
  { b: 'Bexitrol F', g: 'Salmeterol + Fluticasone', c: 'Beximco', s: '250mcg', f: 'ইনহেলার' },
  { b: 'Ambrox', g: 'Ambroxol', c: 'Square', s: '15mg/5ml', f: 'সিরাপ' },
  { b: 'Adovas', g: 'ভেষজ (বাসক)', c: 'Square', s: '—', f: 'সিরাপ' },
  { b: 'Tusca Plus', g: 'Dextromethorphan + Phenylephrine + Triprolidine', c: 'Square', s: '—', f: 'সিরাপ' },

  // ---------- ডায়াবেটিস / হার্ট / প্রেসার ----------
  { b: 'Comet', g: 'Metformin', c: 'Square', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Comet', g: 'Metformin', c: 'Square', s: '850mg', f: 'ট্যাবলেট' },
  { b: 'Secrin', g: 'Glimepiride', c: 'Incepta', s: '2mg', f: 'ট্যাবলেট' },
  { b: 'Amdocal', g: 'Amlodipine', c: 'Beximco', s: '5mg', f: 'ট্যাবলেট' },
  { b: 'Amdocal', g: 'Amlodipine', c: 'Beximco', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Camlodin', g: 'Amlodipine', c: 'Square', s: '5mg', f: 'ট্যাবলেট' },
  { b: 'Angilock', g: 'Losartan', c: 'Square', s: '50mg', f: 'ট্যাবলেট' },
  { b: 'Osartil', g: 'Losartan', c: 'Incepta', s: '50mg', f: 'ট্যাবলেট' },
  { b: 'Indever', g: 'Propranolol', c: 'ACI', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Indever', g: 'Propranolol', c: 'ACI', s: '40mg', f: 'ট্যাবলেট' },
  { b: 'Atova', g: 'Atorvastatin', c: 'Square', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Atova', g: 'Atorvastatin', c: 'Square', s: '20mg', f: 'ট্যাবলেট' },
  { b: 'Rosuva', g: 'Rosuvastatin', c: 'Square', s: '10mg', f: 'ট্যাবলেট' },
  { b: 'Lopirel', g: 'Clopidogrel', c: 'Incepta', s: '75mg', f: 'ট্যাবলেট' },
  { b: 'Carva', g: 'Aspirin', c: 'Square', s: '75mg', f: 'ট্যাবলেট' },
  { b: 'Fusid', g: 'Furosemide', c: 'Square', s: '40mg', f: 'ট্যাবলেট' },

  // ---------- ব্যথা / স্টেরয়েড ----------
  { b: 'Clofenac', g: 'Diclofenac', c: 'Square', s: '50mg', f: 'ট্যাবলেট' },
  { b: 'A-Fenac', g: 'Diclofenac', c: 'Acme', s: '50mg', f: 'ট্যাবলেট' },
  { b: 'Naprosyn', g: 'Naproxen', c: 'Radiant', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Reservix', g: 'Aceclofenac', c: 'Incepta', s: '100mg', f: 'ট্যাবলেট' },
  { b: 'Flamex', g: 'Ibuprofen', c: 'ACI', s: '400mg', f: 'ট্যাবলেট' },
  { b: 'Precodil', g: 'Prednisolone', c: 'Opsonin', s: '5mg', f: 'ট্যাবলেট' },
  { b: 'Cortan', g: 'Prednisolone', c: 'Square', s: '5mg', f: 'ট্যাবলেট' },
  { b: 'Oradexon', g: 'Dexamethasone', c: 'Renata', s: '0.5mg', f: 'ট্যাবলেট' },

  // ---------- ভিটামিন / মিনারেল ----------
  { b: 'Calbo', g: 'Calcium Carbonate', c: 'Square', s: '500mg', f: 'ট্যাবলেট' },
  { b: 'Calbo-D', g: 'Calcium + Vitamin D3', c: 'Square', s: '500mg+200IU', f: 'ট্যাবলেট' },
  { b: 'Coralcal-D', g: 'Coral Calcium + Vitamin D3', c: 'Radiant', s: '500mg+200IU', f: 'ট্যাবলেট' },
  { b: 'Aristocal-D', g: 'Calcium + Vitamin D3', c: 'Aristopharma', s: '500mg+200IU', f: 'ট্যাবলেট' },
  { b: 'D-Rise', g: 'Vitamin D3', c: 'UniMed UniHealth', s: '20000 IU', f: 'ক্যাপসুল' },
  { b: 'Defrol', g: 'Vitamin D3', c: 'Beximco', s: '40000 IU', f: 'ক্যাপসুল' },
  { b: 'Filwel Gold', g: 'Multivitamin + Minerals', c: 'Square', s: '—', f: 'ট্যাবলেট' },
  { b: 'Neuro-B', g: 'Vitamin B1 + B6 + B12', c: 'Square', s: '—', f: 'ট্যাবলেট' },
  { b: 'Zif-CI', g: 'Carbonyl Iron + Folic Acid + Zinc', c: 'Beximco', s: '—', f: 'ক্যাপসুল' },
  { b: 'Folison', g: 'Folic Acid', c: 'Jayson', s: '5mg', f: 'ট্যাবলেট' },
  { b: 'Ceevit', g: 'Vitamin C', c: 'Square', s: '250mg', f: 'চিবানো ট্যাবলেট' },
  { b: 'E-Cap', g: 'Vitamin E', c: 'Drug International', s: '400 IU', f: 'ক্যাপসুল' },

  // ---------- পরিবার পরিকল্পনা ----------
  { b: 'Femicon', g: 'Oral Contraceptive', c: 'SMC', s: '—', f: 'ট্যাবলেট' },
  { b: 'Norix', g: 'Emergency Contraceptive', c: 'SMC', s: '—', f: 'ট্যাবলেট' },
]

// প্রতিটা এন্ট্রিতে ইউনিক আইডি বসানো
MEDICINES.forEach((m, i) => { m.id = 'med_' + i })

// একই জেনেরিকের বিকল্প খোঁজা (পরে প্রেসক্রিপশন ফিচারেও কাজে লাগবে)
export function findAlternatives(generic, excludeBrand) {
  const gl = (generic || '').toLowerCase()
  return MEDICINES.filter(
    (m) => m.g.toLowerCase() === gl && m.b !== excludeBrand,
  )
}
