// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

let dataUserAktif = null;

// 1. CEK KEAMANAN & AMBIL DATA SAAT HALAMAN DIBUKA
async function inisialisasiProfil() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (!user || error) {
        window.location.href = 'login.html'; // Usir jika belum login
        return;
    }

    dataUserAktif = user;
    document.getElementById('teksEmailUser').innerText = user.email;

    // Cek apakah user sudah pernah mengisi biodata sebelumnya
    const { data: profil, error: errorProfil } = await supabaseClient
        .from('profil_user')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (profil) {
        // Jika sudah ada biodata, tampilkan di form
        document.getElementById('namaUser').value = profil.nama_lengkap || '';
        document.getElementById('hpUser').value = profil.no_hp || '';
        document.getElementById('alamatUser').value = profil.alamat_pengiriman || '';
        document.getElementById('teksNamaUser').innerText = profil.nama_lengkap || 'Pengguna Baru';
    } else {
        document.getElementById('teksNamaUser').innerText = 'Pengguna Baru';
    }
}

// 2. SIMPAN BIODATA PENGGUNA
async function simpanProfilUser(event) {
    event.preventDefault();
    
    const nama = document.getElementById('namaUser').value;
    const hp = document.getElementById('hpUser').value;
    const alamat = document.getElementById('alamatUser').value;

    // Cek apakah data sudah ada untuk di-update, atau buat baru (insert)
    const { data: cekProfil } = await supabaseClient
        .from('profil_user')
        .select('id')
        .eq('user_id', dataUserAktif.id)
        .single();

    let proses;
    if (cekProfil) {
        // Update data lama
        proses = await supabaseClient.from('profil_user')
            .update({ nama_lengkap: nama, no_hp: hp, alamat_pengiriman: alamat })
            .eq('user_id', dataUserAktif.id);
    } else {
        // Insert data baru
        proses = await supabaseClient.from('profil_user')
            .insert([{ user_id: dataUserAktif.id, nama_lengkap: nama, no_hp: hp, alamat_pengiriman: alamat }]);
    }

    if (proses.error) {
        alert("Gagal menyimpan biodata.");
        console.error(proses.error);
    } else {
        alert("Biodata berhasil disimpan!");
        document.getElementById('teksNamaUser').innerText = nama;
    }
}

// 3. FUNGSI PINTAR TOMBOL "BUKA TOKO"
async function pergiKeToko() {
    // Cek dulu di database, apakah user ini sudah mendaftarkan toko?
    const { data: toko } = await supabaseClient
        .from('toko')
        .select('id')
        .eq('user_id', dataUserAktif.id)
        .single();

    if (toko) {
        // Jika SUDAH punya toko, langsung arahkan ke Dashboard Penjual
        window.location.href = 'dashboard.html';
    } else {
        // Jika BELUM punya toko, arahkan ke Form Pendaftaran Toko
        window.location.href = 'daftar-toko.html';
    }
}

// 4. LOGOUT
async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// Jalankan saat pertama kali dibuka
inisialisasiProfil();