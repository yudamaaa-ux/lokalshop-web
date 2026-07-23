// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

let currentUser = null;
let currentTokoId = null; // Menyimpan ID toko milik user secara diam-diam

// 1. CEK LOGIN & DETEKSI TOKO OTOMATIS
async function inisialisasiHalaman() {
    const infoToko = document.getElementById('infoToko');
    infoToko.classList.remove('hidden');

    // A. Pastikan user sudah login
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (!user || authError) {
        alert("Sesi berakhir. Silakan masuk (login) kembali.");
        window.location.href = "login.html";
        return;
    }
    currentUser = user;

    // B. Cari data toko di database yang sesuai dengan KTP digital (user_id)
    try {
        const { data: tokoData, error: tokoError } = await supabaseClient
            .from('toko')
            .select('id, nama_toko')
            .eq('user_id', currentUser.id)
            .single(); // Ambil 1 toko saja milik user tersebut

        if (tokoError || !tokoData) {
            // Jika user sudah login tapi belum buat toko
            alert("Anda belum mendaftarkan toko. Mari buat profil toko Anda sekarang!");
            window.location.href = "daftar.html";
            return;
        }

        // C. Jika toko ditemukan, simpan ID-nya dan tampilkan form
        currentTokoId = tokoData.id;
        infoToko.innerHTML = `👋 Halo, mengelola etalase: <strong>${tokoData.nama_toko}</strong>`;
        infoToko.classList.replace('bg-blue-50', 'bg-green-50');
        infoToko.classList.replace('text-blue-800', 'text-green-800');
        infoToko.classList.replace('border-blue-200', 'border-green-200');
        
        // Munculkan form pendaftaran produk
        document.getElementById('formProduk').classList.remove('hidden');

    } catch (err) {
        console.error("Gagal mendeteksi toko:", err);
        infoToko.innerHTML = "Gagal memuat data toko. Periksa koneksi Anda.";
    }
}

// 2. FUNGSI LOGOUT (KELUAR)
async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
}

// 3. FUNGSI UTAMA MENYIMPAN DATA & FOTO
async function simpanProduk(event) {
    event.preventDefault();
    
    // Keamanan: pastikan ID toko sudah didapatkan
    if (!currentTokoId) {
        alert("Terjadi kesalahan. Data toko tidak ditemukan.");
        return;
    }

    const btnSimpan = document.getElementById('btnSimpan');
    btnSimpan.innerText = "Mengupload Foto & Menyimpan...";
    btnSimpan.disabled = true;

    // Ambil data teks
    const nama = document.getElementById('namaProduk').value;
    const kategori = document.getElementById('kategoriProduk').value;
    const deskripsi = document.getElementById('deskripsiProduk').value;
    const harga = document.getElementById('hargaProduk').value;
    const varian = document.getElementById('varianProduk').value;
    const statusStok = document.querySelector('input[name="statusStok"]:checked').value;

    const checkboxes = document.querySelectorAll('.opsi-pengiriman:checked');
    let pengirimanArr = [];
    checkboxes.forEach((cb) => { pengirimanArr.push(cb.value); });
    const opsiPengiriman = pengirimanArr.join(', ');

    const fileInput = document.getElementById('fotoFile');
    const file = fileInput.files[0];
    let fotoUrlFinal = "";

    try {
        // PROSES UPLOAD FOTO
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabaseClient
                .storage
                .from('foto_produk')
                .upload(fileName, file);

            if (uploadError) throw new Error("Gagal mengupload foto.");

            const { data: publicUrlData } = supabaseClient
                .storage
                .from('foto_produk')
                .getPublicUrl(fileName);
            
            fotoUrlFinal = publicUrlData.publicUrl;
        }

        // PROSES SIMPAN KE DATABASE (Gunakan currentTokoId)
        const { error: dbError } = await supabaseClient
            .from('produk')
            .insert([
                { 
                    toko_id: currentTokoId, // Otomatis masuk ke toko milik user
                    nama_produk: nama,
                    kategori_produk: kategori,
                    deskripsi: deskripsi,
                    harga: harga,
                    status_stok: statusStok,
                    varian: varian,
                    opsi_pengiriman: opsiPengiriman,
                    foto_url: fotoUrlFinal
                }
            ]);

        if (dbError) throw dbError;

        alert(`Berhasil! Produk "${nama}" masuk ke etalase Anda.`);
        document.getElementById('formProduk').reset();
        
    } catch (err) {
        console.error("Masalah:", err);
        alert(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
        btnSimpan.innerText = "Simpan & Upload Produk";
        btnSimpan.disabled = false;
    }
}

// Jalankan saat layar dibuka
inisialisasiHalaman();