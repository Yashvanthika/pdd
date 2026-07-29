export interface DistrictLocation {
  district: string;
  cities: string[];
}

export interface StateLocation {
  state: string;
  districts: DistrictLocation[];
}

// Andhra Pradesh district/city options include mandal-level localities because
// the state district sites publish those as the most complete selectable list.
const ANDHRA_PRADESH_DISTRICTS: DistrictLocation[] = [
  { district: 'Alluri Sitharama Raju', cities: ['Paderu', 'Ananthagiri', 'Araku Valley', 'Chintapalli', 'Dumbriguda', 'G.K. Veedhi', 'G. Madugula', 'Hukumpeta', 'Koyyuru', 'Munchingput', 'Pedabayalu'] },
  { district: 'Anakapalli', cities: ['Anakapalli', 'Atchutapuram', 'Butchiahpeta', 'Cheedikada', 'Chodavaram', 'Devarapalli', 'Golugonda', 'K. Kotapadu', 'Kasimkota', 'Kotauratla', 'Madugula', 'Makavarapalem', 'Munagapaka', 'Nakkapalli', 'Narsipatnam', 'Nathavaram', 'Parawada', 'Payakaraopeta', 'Rambilli', 'Ravikamatham', 'Rolugunta', 'S. Rayavaram', 'Sabbavaram', 'Yelamanchili'] },
  { district: 'Anantapur', cities: ['Anantapur', 'Anantapur Rural', 'Anantapur Urban', 'Atmakur', 'Beluguppa', 'BK Samudram', 'Bommanahal', 'Brahmasamudram', 'D. Hirehal', 'Garladinne', 'Gooty', 'Gummagatta', 'Guntakal', 'Kalyandurg', 'Kambadur', 'Kanekal', 'Kudair', 'Kundurpi', 'Narpala', 'Pamidi', 'Peddapappur', 'Peddavadugur', 'Putluru', 'Raptadu', 'Rayadurg', 'Settur', 'Singanamala', 'Tadpatri', 'Uravakonda', 'Vajrakarur', 'Vidapanakal', 'Yadiki', 'Yellanur'] },
  { district: 'Annamayya', cities: ['Rayachoti', 'Beerangi Kothakota', 'Chinnamandem', 'Chitvel', 'Chowdepalle', 'Galiveedu', 'Gurramkonda', 'Kalakada', 'Kalikiri', 'Kodur', 'Kurabalakota', 'K. V. Palli', 'L. R. Palli', 'Madanapalle', 'Mulakalacheruvu', 'Nandalur', 'Nimmanapalle', 'Obulavaripalli', 'Pedda Thippasamudram', 'Peddamandyam', 'Penagalur', 'Pileru', 'Pullampet', 'Punganur', 'Rajampet', 'Ramapuram', 'Ramasamudram', 'Sambepalli', 'Somala', 'Sodum', 'T. Sundupalli', 'Thamballapalle', 'Valmikipuram', 'Veeraballi'] },
  { district: 'Bapatla', cities: ['Bapatla', 'Amruthalur', 'Bhattiprolu', 'Cherukupalle', 'Chinaganjam', 'Chirala', 'Inkollu', 'Karamchedu', 'Karlapalem', 'Kollur', 'Martur', 'Nagaram', 'Nizampatnam', 'Parchur', 'Pittalavanipalem', 'Repalle', 'Tsundur', 'Vemuru', 'Vetapalem', 'Yeddanapudi'] },
  { district: 'Chittoor', cities: ['Chittoor', 'Baireddipalle', 'Bangarupalem', 'Chittoor Rural', 'Chittoor Urban', 'Gangadhara Nellore', 'Gangavaram', 'Gudipala', 'Gudupalle', 'Irala', 'Karvetinagar', 'Kuppam', 'Nagari', 'Nindra', 'Palamaner', 'Palasamudram', 'Peddapanjani', 'Penumur', 'Pulicherla', 'Puthalapattu', 'Ramakuppam', 'Rompicherla', 'Santhipuram', 'Srirangarajapuram', 'Thavanampalle', 'Vedurukuppam', 'Venkatagiri Kota', 'Vijayapuram', 'Yadamari'] },
  { district: 'Dr. B.R. Ambedkar Konaseema', cities: ['Amalapuram', 'Ainavilli', 'Alamuru', 'Allavaram', 'Ambajipeta', 'Atreyapuram', 'I. Polavaram', 'K. Gangavaram', 'Katrenikona', 'Kothapeta', 'Malikipuram', 'Mamidikuduru', 'Mandapeta', 'Mummidivaram', 'P. Gannavaram', 'Ramachandrapuram', 'Ravulapalem', 'Razole', 'Sakhinetipalle', 'Uppalaguptam'] },
  { district: 'East Godavari', cities: ['Rajamahendravaram', 'Rajahmundry', 'Anaparthi', 'Biccavolu', 'Chagallu', 'Devarapalle', 'Gokavaram', 'Gopalapuram', 'Kadiam', 'Kapileswarapuram', 'Korukonda', 'Kovvur', 'Mandapeta', 'Nallajerla', 'Nidadavole', 'Peravali', 'Rajamahendravaram Rural', 'Rajamahendravaram Urban', 'Rajanagaram', 'Rangampeta', 'Rayavaram', 'Seethanagaram', 'Tallapudi', 'Undrajavaram'] },
  { district: 'Eluru', cities: ['Eluru', 'Agiripalli', 'Bhimadole', 'Buttaigudem', 'Chatrai', 'Chintalapudi', 'Denduluru', 'Dwaraka Tirumala', 'Jangareddygudem', 'Jeelugumilli', 'Kaikaluru', 'Kalidindi', 'Kamavarapukota', 'Koyyalagudem', 'Kukunoor', 'Lingapalem', 'Mandavalli', 'Mudinepalle', 'Musunuru', 'Nidamarru', 'Nuziveedu', 'Pedapadu', 'Pedavegi', 'Polavaram', 'T. Narasapuram', 'Unguturu', 'Velairpad'] },
  { district: 'Guntur', cities: ['Guntur', 'Guntur East', 'Guntur West', 'Chebrolu', 'Duggirala', 'Kakumanu', 'Kollipara', 'Mangalagiri', 'Medikonduru', 'Pedakakani', 'Pedanandipadu', 'Phirangipuram', 'Ponnur', 'Prathipadu', 'Tadepalle', 'Tadikonda', 'Tenali', 'Thullur', 'Vatticherukuru'] },
  { district: 'Kakinada', cities: ['Kakinada', 'Gandepalli', 'Gollaprolu', 'Jaggampeta', 'Kajuluru', 'Karapa', 'Kirlampudi', 'Kotananduru', 'Peddapuram', 'Pedapudi', 'Pithapuram', 'Prathipadu', 'Rowtulapudi', 'Samalkota', 'Shankhavaram', 'Thallarevu', 'Thondangi', 'Tuni', 'U. Kotapalli', 'Yeleswaram'] },
  { district: 'Krishna', cities: ['Machilipatnam', 'Avanigadda', 'Bantumilli', 'Bapulapadu', 'Challapalli', 'Gannavaram', 'Ghantasala', 'Gudivada', 'Gudlavalleru', 'Guduru', 'Kankipadu', 'Koduru', 'Kruthivennu', 'Machilipatnam North', 'Machilipatnam South', 'Mopidevi', 'Movva', 'Nagayalanka', 'Nandivada', 'Pamarru', 'Pamidimukkala', 'Pedana', 'Pedaparupudi', 'Penamaluru', 'Thotlavalluru', 'Unguturu', 'Vuyyuru'] },
  { district: 'Kurnool', cities: ['Kurnool', 'Adoni', 'Adoni 1', 'Adoni 2', 'Alur', 'Aspari', 'C. Belagal', 'Chippagiri', 'Devanakonda', 'Gonegandla', 'Gudur', 'Halaharvi', 'Holagonda', 'Kallur', 'Kodumur', 'Kosigi', 'Kowthalam', 'Krishnagiri', 'Kurnool Urban', 'Maddikera', 'Mantralayam', 'Nandavaram', 'Orvakal', 'Pattikonda', 'Peddakadubur', 'Tuggali', 'Veldurthi', 'Yemmiganur'] },
  { district: 'Markapuram', cities: ['Markapuram', 'Ardhaveedu', 'Bestavaripeta', 'Chandra Sekhara Puram', 'Cumbum', 'Dornala', 'Giddalur', 'Hanumanthuni Padu', 'Kanigiri', 'Komarolu', 'Konakanamitla', 'Pamur', 'Pedacherlo Palle', 'Peddaaraveedu', 'Podili', 'Pullalacheruvu', 'Racherla', 'Tarlupadu', 'Tripuranthakam', 'Veligandla', 'Yerragondapalem'] },
  { district: 'Nandyal', cities: ['Nandyal', 'Allagadda', 'Atmakur', 'Banaganapalli', 'Bandi Atmakur', 'Betamcherla', 'Chagalamari', 'Dhone', 'Dornipadu', 'Gadivemula', 'Gospadu', 'Jupadu Bunglow', 'Koilkuntla', 'Kolimigundla', 'Kothapalli', 'Mahanandi', 'Midthur', 'Nandikotkur', 'Owk', 'Pagidyala', 'Pamulapadu', 'Panyam', 'Peapully', 'Rudravaram', 'Sanjamala', 'Sirvel', 'Srisailam', 'Uyyalawada', 'Velgodu'] },
  { district: 'NTR', cities: ['Vijayawada', 'A Konduru', 'Chandarlapadu', 'G Konduru', 'Gampalagudem', 'Ibrahimpatnam', 'Jaggaiahpeta', 'Kanchikacherla', 'Mylavaram', 'Nandigama', 'Penuganchiprolu', 'Reddigudem', 'Tiruvuru', 'Vatsavai', 'Veerullapadu', 'Vijayawada Central', 'Vijayawada East', 'Vijayawada North', 'Vijayawada Rural', 'Vijayawada West', 'Vissannapeta'] },
  { district: 'Palnadu', cities: ['Narasaraopet', 'Amaravathi', 'Atchampet', 'Bellamkonda', 'Bollapalli', 'Chilakaluripet', 'Dachepalli', 'Durgi', 'Edlapadu', 'Gurazala', 'Ipur', 'Karempudi', 'Krosuru', 'Machavaram', 'Macherla', 'Muppalla', 'Nadendla', 'Nekarikallu', 'Nuzendla', 'Pedakurapadu', 'Piduguralla', 'Rajupalem', 'Rentachintala', 'Rompicherla', 'Sattenapalli', 'Savalyapuram', 'Veldurthi', 'Vinukonda'] },
  { district: 'Parvathipuram Manyam', cities: ['Parvathipuram', 'Balijipeta', 'Bhamini', 'Garugubilli', 'Gummalakshmipuram', 'Jiyammavalasa', 'Komarada', 'Kurupam', 'Makkuva', 'Pachipenta', 'Palakonda', 'Salur', 'Seethampeta', 'Seethanagaram', 'Veeraghattam'] },
  { district: 'Polavaram', cities: ['Rampachodavaram', 'Addateegala', 'Chinturu', 'Devipatnam', 'Gangavaram', 'Gurthedu', 'Kunavaram', 'Maredumilli', 'Rajavommangi', 'Vararamachandrapuram', 'Y. Ramavaram', 'Yetapaka'] },
  { district: 'Prakasam', cities: ['Ongole', 'Addanki', 'Ballikurava', 'Chimakurthi', 'Darsi', 'Donakonda', 'Gudluru', 'Janakavaram Panguluru', 'Kandukuru', 'Kondapi', 'Korisapadu', 'Kotha Patnam', 'Kurichedu', 'Lingasamudram', 'Maddipadu', 'Marripudi', 'Mundlamuru', 'Naguluppala Padu', 'Ongole Rural', 'Ongole Urban', 'Ponnaluru', 'Santhamaguluru', 'Santhanuthala Padu', 'Singarayakonda', 'Tanguturu', 'Thallur', 'Ulavapadu', 'Voletivaripalem', 'Zarugumalli'] },
  { district: 'Sri Potti Sriramulu Nellore', cities: ['Nellore', 'Allur', 'Ananthasagaram', 'Anumasamudrampeta', 'Atmakur', 'Bogole', 'Buchireddypalem', 'Chejerla', 'Chillakur', 'Dagadarthi', 'Duttalur', 'Gudur', 'Indukurpet', 'Jaladanki', 'Kaligiri', 'Kaluvoya', 'Kavali', 'Kodavalur', 'Kondapuram', 'Kota', 'Kovur', 'Manubolu', 'Marripadu', 'Muthukur', 'Nellore Rural', 'Nellore Urban', 'Podalakur', 'Rapur', 'Sangam', 'Seetharamapuram', 'Sydapuram', 'Thotapalli Gudur', 'Udayagiri', 'Varikuntapadu', 'Venkatachalam', 'Vidavalur', 'Vinjamur'] },
  { district: 'Sri Sathya Sai', cities: ['Puttaparthi', 'Agali', 'Amadagur', 'Amarapuram', 'Bathalapalle', 'Bukkapatnam', 'Chennekothapalli', 'Chilamathur', 'Dharmavaram', 'Gandlapenta', 'Gorantla', 'Gudibanda', 'Hindupur', 'Kadiri', 'Kanaganapalli', 'Kothacheruvu', 'Lepakshi', 'Madakasira', 'Mudigubba', 'Nallacheruvu', 'Nallamada', 'Nambulapulakunta', 'Obuladevaracheruvu', 'Parigi', 'Penukonda', 'Ramagiri', 'Roddam', 'Rolla', 'Somandepalli', 'Tadimarri', 'Talupula', 'Tanakal'] },
  { district: 'Srikakulam', cities: ['Srikakulam', 'Amadalavalasa', 'Burja', 'Etcherla', 'G. Sigadam', 'Gara', 'Hiramandalam', 'Ichapuram', 'Jalumuru', 'Kanchili', 'Kaviti', 'Kotabommali', 'Kotturu', 'L. N. Peta', 'Laveru', 'Mandasa', 'Meliaputti', 'Nandigam', 'Narasannapeta', 'Palasa', 'Pathapatnam', 'Polaki', 'Ponduru', 'Ranasthalam', 'Santabommali', 'Saravakota', 'Sarubujjili', 'Sompeta', 'Tekkali', 'Vajrapukotturu'] },
  { district: 'Tirupati', cities: ['Tirupati', 'Balayapalli', 'Buchi Naidu Kandriga', 'Chandragiri', 'Chinnagottigallu', 'Chittamur', 'Chitvel', 'Dakkili', 'Doravarisatram', 'Koduru', 'Kumara Venkata Bhupala Puram', 'Nagalapuram', 'Naidupeta', 'Narayanavanam', 'Obulavaripalle', 'Ozili', 'Pakala', 'Pellakur', 'Penagalur', 'Pitchatur', 'Pullampeta', 'Puttur', 'Ramachandrapuram', 'Renigunta', 'Satyavedu', 'Srikalahasthi', 'Sullurpet', 'Tada', 'Thottambedu', 'Tirupati Rural', 'Tirupati Urban', 'Vadamalapeta', 'Vakadu', 'Varadaiahpalem', 'Venkatagiri', 'Yerpedu', 'Yerravaripalem'] },
  { district: 'Visakhapatnam', cities: ['Visakhapatnam', 'Anandapuram', 'Bheemunipatnam', 'Gajuwaka', 'Gopalpatnam', 'Maharanipeta', 'Mulagada', 'Padmanabham', 'Pedagantyada', 'Pendurthi', 'Seethammadhara'] },
  { district: 'Vizianagaram', cities: ['Vizianagaram', 'Badangi', 'Bhogapuram', 'Bobbili', 'Bondapalli', 'Cheepurupalli', 'Dattirajeru', 'Denkada', 'Gajapathinagaram', 'Gantyada', 'Garividi', 'Gurla', 'Jami', 'Kothavalasa', 'Lakkavarapukota', 'Mentada', 'Merakamudiam', 'Nellimarla', 'Pusapatirega', 'Rajam', 'Regidlamandalavalasa', 'Ramabhadrapuram', 'Santhakaviti', 'Srungavarapukota', 'Therlam', 'Vangara', 'Vepada'] },
  { district: 'West Godavari', cities: ['Bhimavaram', 'Achanta', 'Akividu', 'Attili', 'Elamanchili', 'Ganapavaram', 'Iragavaram', 'Kalla', 'Mogalturu', 'Narsapuram', 'Palakoderu', 'Palakollu', 'Pentapadu', 'Penugonda', 'Penumantra', 'Poduru', 'Tadepalligudem', 'Tanuku', 'Undi', 'Veeravasaram'] },
  { district: 'YSR Kadapa', cities: ['Kadapa', 'Atloor', 'B. Kodur', 'B. Mattam', 'Badvel', 'C. K. Dinne', 'Chakrayapet', 'Chapadu', 'Chennur', 'Duvvur', 'Gopavaram', 'Jammalamadugu', 'Kalasapadu', 'Kamalapuram', 'Khajipeta', 'Kondapuram', 'Lingala', 'Muddanur', 'Mydukur', 'Mylavaram', 'Pendlimarri', 'Peddamudiam', 'Porumamilla', 'Proddutur', 'Pulivendula', 'Rajupalem', 'S. A. K. N.', 'Sidhout', 'Simhadripuram', 'Thondur', 'Vallur', 'Veerapunayunipalle', 'Vemula', 'Vempalli', 'Vontimitta', 'Yerraguntla'] },
];

// India location seed list for offline pickers. The app stores exact
// labels from this list and the backend validates search/profile submissions
// against the same data.
export const INDIA_LOCATIONS: StateLocation[] = [
  { state: 'Andaman and Nicobar Islands', districts: [{ district: 'South Andaman', cities: ['Port Blair'] }, { district: 'North and Middle Andaman', cities: ['Mayabunder'] }, { district: 'Nicobars', cities: ['Car Nicobar'] }] },
  { state: 'Andhra Pradesh', districts: ANDHRA_PRADESH_DISTRICTS },
  { state: 'Arunachal Pradesh', districts: [{ district: 'Papum Pare', cities: ['Itanagar'] }, { district: 'East Siang', cities: ['Pasighat'] }, { district: 'Lohit', cities: ['Tezu'] }] },
  { state: 'Assam', districts: [{ district: 'Kamrup Metropolitan', cities: ['Guwahati'] }, { district: 'Dibrugarh', cities: ['Dibrugarh'] }, { district: 'Cachar', cities: ['Silchar'] }, { district: 'Jorhat', cities: ['Jorhat'] }] },
  { state: 'Bihar', districts: [{ district: 'Patna', cities: ['Patna'] }, { district: 'Gaya', cities: ['Gaya'] }, { district: 'Bhagalpur', cities: ['Bhagalpur'] }, { district: 'Muzaffarpur', cities: ['Muzaffarpur'] }] },
  { state: 'Chandigarh', districts: [{ district: 'Chandigarh', cities: ['Chandigarh'] }] },
  { state: 'Chhattisgarh', districts: [{ district: 'Raipur', cities: ['Raipur'] }, { district: 'Bilaspur', cities: ['Bilaspur'] }, { district: 'Durg', cities: ['Durg', 'Bhilai'] }] },
  { state: 'Dadra and Nagar Haveli and Daman and Diu', districts: [{ district: 'Daman', cities: ['Daman'] }, { district: 'Diu', cities: ['Diu'] }, { district: 'Dadra and Nagar Haveli', cities: ['Silvassa'] }] },
  { state: 'Delhi', districts: [{ district: 'Central Delhi', cities: ['New Delhi'] }, { district: 'South Delhi', cities: ['Saket'] }, { district: 'North West Delhi', cities: ['Rohini'] }] },
  { state: 'Goa', districts: [{ district: 'North Goa', cities: ['Panaji', 'Mapusa'] }, { district: 'South Goa', cities: ['Margao', 'Vasco da Gama'] }] },
  { state: 'Gujarat', districts: [{ district: 'Ahmedabad', cities: ['Ahmedabad'] }, { district: 'Surat', cities: ['Surat'] }, { district: 'Vadodara', cities: ['Vadodara'] }, { district: 'Rajkot', cities: ['Rajkot'] }] },
  { state: 'Haryana', districts: [{ district: 'Gurugram', cities: ['Gurugram'] }, { district: 'Faridabad', cities: ['Faridabad'] }, { district: 'Panchkula', cities: ['Panchkula'] }, { district: 'Hisar', cities: ['Hisar'] }] },
  { state: 'Himachal Pradesh', districts: [{ district: 'Shimla', cities: ['Shimla'] }, { district: 'Kangra', cities: ['Dharamshala'] }, { district: 'Kullu', cities: ['Kullu'] }] },
  { state: 'Jammu and Kashmir', districts: [{ district: 'Srinagar', cities: ['Srinagar'] }, { district: 'Jammu', cities: ['Jammu'] }, { district: 'Anantnag', cities: ['Anantnag'] }] },
  { state: 'Jharkhand', districts: [{ district: 'Ranchi', cities: ['Ranchi'] }, { district: 'East Singhbhum', cities: ['Jamshedpur'] }, { district: 'Dhanbad', cities: ['Dhanbad'] }] },
  { state: 'Karnataka', districts: [{ district: 'Bengaluru Urban', cities: ['Bengaluru'] }, { district: 'Mysuru', cities: ['Mysuru'] }, { district: 'Dakshina Kannada', cities: ['Mangaluru'] }, { district: 'Belagavi', cities: ['Belagavi'] }] },
  { state: 'Kerala', districts: [{ district: 'Thiruvananthapuram', cities: ['Thiruvananthapuram'] }, { district: 'Ernakulam', cities: ['Kochi'] }, { district: 'Kozhikode', cities: ['Kozhikode'] }, { district: 'Thrissur', cities: ['Thrissur'] }] },
  { state: 'Ladakh', districts: [{ district: 'Leh', cities: ['Leh'] }, { district: 'Kargil', cities: ['Kargil'] }] },
  { state: 'Lakshadweep', districts: [{ district: 'Lakshadweep', cities: ['Kavaratti'] }] },
  { state: 'Madhya Pradesh', districts: [{ district: 'Bhopal', cities: ['Bhopal'] }, { district: 'Indore', cities: ['Indore'] }, { district: 'Jabalpur', cities: ['Jabalpur'] }, { district: 'Gwalior', cities: ['Gwalior'] }] },
  { state: 'Maharashtra', districts: [{ district: 'Mumbai City', cities: ['Mumbai'] }, { district: 'Pune', cities: ['Pune'] }, { district: 'Nagpur', cities: ['Nagpur'] }, { district: 'Nashik', cities: ['Nashik'] }] },
  { state: 'Manipur', districts: [{ district: 'Imphal West', cities: ['Imphal'] }, { district: 'Thoubal', cities: ['Thoubal'] }, { district: 'Bishnupur', cities: ['Bishnupur'] }] },
  { state: 'Meghalaya', districts: [{ district: 'East Khasi Hills', cities: ['Shillong'] }, { district: 'West Garo Hills', cities: ['Tura'] }, { district: 'Ri Bhoi', cities: ['Nongpoh'] }] },
  { state: 'Mizoram', districts: [{ district: 'Aizawl', cities: ['Aizawl'] }, { district: 'Lunglei', cities: ['Lunglei'] }, { district: 'Champhai', cities: ['Champhai'] }] },
  { state: 'Nagaland', districts: [{ district: 'Kohima', cities: ['Kohima'] }, { district: 'Dimapur', cities: ['Dimapur'] }, { district: 'Mokokchung', cities: ['Mokokchung'] }] },
  { state: 'Odisha', districts: [{ district: 'Khordha', cities: ['Bhubaneswar'] }, { district: 'Cuttack', cities: ['Cuttack'] }, { district: 'Ganjam', cities: ['Berhampur'] }, { district: 'Sambalpur', cities: ['Sambalpur'] }] },
  { state: 'Puducherry', districts: [{ district: 'Puducherry', cities: ['Puducherry'] }, { district: 'Karaikal', cities: ['Karaikal'] }, { district: 'Mahe', cities: ['Mahe'] }, { district: 'Yanam', cities: ['Yanam'] }] },
  { state: 'Punjab', districts: [{ district: 'Amritsar', cities: ['Amritsar'] }, { district: 'Ludhiana', cities: ['Ludhiana'] }, { district: 'Jalandhar', cities: ['Jalandhar'] }, { district: 'Patiala', cities: ['Patiala'] }] },
  { state: 'Rajasthan', districts: [{ district: 'Jaipur', cities: ['Jaipur'] }, { district: 'Jodhpur', cities: ['Jodhpur'] }, { district: 'Udaipur', cities: ['Udaipur'] }, { district: 'Kota', cities: ['Kota'] }] },
  { state: 'Sikkim', districts: [{ district: 'Gangtok', cities: ['Gangtok'] }, { district: 'Namchi', cities: ['Namchi'] }, { district: 'Gyalshing', cities: ['Gyalshing'] }] },
  { state: 'Tamil Nadu', districts: [{ district: 'Chennai', cities: ['Chennai'] }, { district: 'Coimbatore', cities: ['Coimbatore'] }, { district: 'Madurai', cities: ['Madurai'] }, { district: 'Tiruchirappalli', cities: ['Tiruchirappalli'] }] },
  { state: 'Telangana', districts: [{ district: 'Hyderabad', cities: ['Hyderabad'] }, { district: 'Ranga Reddy', cities: ['Gachibowli', 'Shamshabad'] }, { district: 'Warangal', cities: ['Warangal'] }, { district: 'Karimnagar', cities: ['Karimnagar'] }] },
  { state: 'Tripura', districts: [{ district: 'West Tripura', cities: ['Agartala'] }, { district: 'North Tripura', cities: ['Dharmanagar'] }, { district: 'South Tripura', cities: ['Belonia'] }] },
  { state: 'Uttar Pradesh', districts: [{ district: 'Lucknow', cities: ['Lucknow'] }, { district: 'Kanpur Nagar', cities: ['Kanpur'] }, { district: 'Varanasi', cities: ['Varanasi'] }, { district: 'Prayagraj', cities: ['Prayagraj'] }] },
  { state: 'Uttarakhand', districts: [{ district: 'Dehradun', cities: ['Dehradun'] }, { district: 'Haridwar', cities: ['Haridwar'] }, { district: 'Nainital', cities: ['Haldwani', 'Nainital'] }] },
  { state: 'West Bengal', districts: [{ district: 'Kolkata', cities: ['Kolkata'] }, { district: 'North 24 Parganas', cities: ['Barasat'] }, { district: 'Darjeeling', cities: ['Darjeeling', 'Siliguri'] }, { district: 'Howrah', cities: ['Howrah'] }] },
];

export function getStates(): string[] {
  return INDIA_LOCATIONS.map((entry) => entry.state);
}

export function getDistricts(state?: string): StateLocation[] | string[] {
  if (!state) return INDIA_LOCATIONS;
  return INDIA_LOCATIONS.find((entry) => entry.state === state)?.districts.map((entry) => entry.district) || [];
}

export function getCities(state: string, district: string): string[] {
  return INDIA_LOCATIONS
    .find((entry) => entry.state === state)
    ?.districts.find((entry) => entry.district === district)
    ?.cities || [];
}

export function isValidLocation(state: string, district: string, city: string): boolean {
  return getCities(state, district).includes(city);
}
