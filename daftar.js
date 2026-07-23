// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

// Variabel untuk menyimpan data user yang sedang login
let currentUser = null;

// 1. Cek apakah pengguna sudah login saat halaman dibuka
async function cekLogin() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (!user || error) {
        alert("Anda harus masuk (login) terlebih dahulu untuk membuka toko!");
        window.location.href = "login.html"; // Usir kembali ke halaman login
    } else {
        currentUser = user; // Simpan data KTP (ID) user
    }
}
// Jalankan fungsi cek login secara otomatis
cekLogin(); 

// 2. Fungsi mendaftar toko
async function daftarToko(event) {
    event.preventDefault(); 
    
    // Keamanan ganda: pastikan user benar-benar ada sebelum submit
    if (!currentUser) {
        alert("Sesi Anda tidak valid. Silakan login ulang.");
        window.location.href = "login.html";
        return;
    }

    const btnDaftar = document.getElementById('btnDaftar');
    btnDaftar.innerText = "Memproses...";
    btnDaftar.disabled = true;

    // Mengambil semua data dari formulir
    const inputNama = document.getElementById('namaToko').value;
    const inputPemilik = document.getElementById('namaPemilik').value;
    const inputKategori = document.getElementById('kategori').value;
    
    // Membersihkan awalan 0 
    let rawWA = document.getElementById('noWA').value;
    if(rawWA.startsWith('0')) { rawWA = rawWA.substring(1); }
    const finalWA = '62' + rawWA; 

    const inputKelurahan = document.getElementById('kelurahan').value;
    const inputKecamatan = document.getElementById('kecamatan').value;
    const inputRTRW = document.getElementById('rtrw').value;
    const inputLokasi = document.getElementById('lokasiSpesifik').value;
    const inputTentang = document.getElementById('tentangToko').value;

    try {
        // Mengirim data ke Supabase DENGAN menempelkan user_id
        const { data, error } = await supabaseClient
            .from('toko')
            .insert([
                { 
                    user_id: currentUser.id, // <--- INI KUNCI PENGHUBUNGNYA
                    nama_toko: inputNama,
                    nama_pemilik: inputPemilik,
                    kategori: inputKategori,
                    no_whatsapp: finalWA,
                    kelurahan: inputKelurahan,
                    kecamatan: inputKecamatan,
                    alamat_rt_rw: inputRTRW,
                    lokasi_spesifik: inputLokasi,
                    tentang_toko: inputTentang
                }
            ]);

        if (error) throw error;

        alert(`Selamat! Toko ${inputNama} berhasil didaftarkan. Mari mulai tambah produk!`);
        
        // Karena sudah login, langsung arahkan ke halaman tambah produk!
        window.location.href = "tambah-produk.html";
        
    } catch (err) {
        console.error("Gagal mendaftar:", err);
        alert("Terjadi kesalahan saat mendaftar. Silakan coba lagi.");
    } finally {
        btnDaftar.innerText = "Daftar & Klaim Saldo";
        btnDaftar.disabled = false;
    }
}