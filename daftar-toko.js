// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

let user_id_saat_ini = null;

// Cek Keamanan
async function cekAkses() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
    } else {
        user_id_saat_ini = user.id;
    }
}

// Proses Pembuatan Toko Baru
async function daftarkanTokoBaru(event) {
    event.preventDefault();
    
    const nama = document.getElementById('namaTokoBaru').value;
    const wa = document.getElementById('waTokoBaru').value;
    const alamat = document.getElementById('alamatTokoBaru').value;

    // Simpan ke tabel toko
    const { error } = await supabaseClient.from('toko').insert([{
        user_id: user_id_saat_ini,
        nama_toko: nama,
        no_whatsapp: wa,
        alamat: alamat,
        status_toko: 'aktif' // Bisa dibuat 'pending' jika butuh admin approve
    }]);

    if (error) {
        alert("Terjadi kesalahan saat mendaftar toko.");
        console.error(error);
    } else {
        alert("Selamat! Toko Anda berhasil dibuat.");
        // Sukses? Langsung lempar ke ruang kerja penjual!
        window.location.href = 'dashboard.html'; 
    }
}

cekAkses();