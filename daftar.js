// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;

// Kunci dan URL sudah otomatis terpasang
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';

const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

async function daftarToko(event) {
    event.preventDefault(); 
    
    const btnDaftar = document.getElementById('btnDaftar');
    btnDaftar.innerText = "Memproses...";
    btnDaftar.disabled = true;

    // Mengambil semua data dari formulir
    const inputNama = document.getElementById('namaToko').value;
    const inputPemilik = document.getElementById('namaPemilik').value;
    const inputKategori = document.getElementById('kategori').value;
    
    // Membersihkan awalan 0 jika user terlanjur mengetiknya
    let rawWA = document.getElementById('noWA').value;
    if(rawWA.startsWith('0')) { rawWA = rawWA.substring(1); }
    const finalWA = '62' + rawWA; // Format internasional tanpa '+'

    const inputKelurahan = document.getElementById('kelurahan').value;
    const inputKecamatan = document.getElementById('kecamatan').value;
    const inputRTRW = document.getElementById('rtrw').value;
    const inputLokasi = document.getElementById('lokasiSpesifik').value;
    const inputTentang = document.getElementById('tentangToko').value;

    try {
        // Mengirim data ke Supabase (Kolom baru sudah disertakan)
        const { data, error } = await supabaseClient
            .from('toko')
            .insert([
                { 
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

        if (error) {
            console.error("Error Supabase:", error);
            throw error;
        }

        alert(`Selamat! Toko ${inputNama} berhasil didaftarkan. Saldo awal Rp 15.000 telah masuk.`);
        document.getElementById('formDaftar').reset();
        
    } catch (err) {
        console.error("Gagal mendaftar:", err);
        alert("Terjadi kesalahan saat mendaftar. Silakan coba lagi.");
    } finally {
        btnDaftar.innerText = "Daftar & Klaim Saldo";
        btnDaftar.disabled = false;
    }
}