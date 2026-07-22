// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

// 1. Memuat Daftar Toko
async function muatDaftarToko() {
    const dropdown = document.getElementById('pilihToko');
    try {
        const { data, error } = await supabaseClient
            .from('toko')
            .select('id, nama_toko')
            .order('nama_toko', { ascending: true });

        if (error) throw error;

        dropdown.innerHTML = '<option value="" disabled selected>-- Pilih Toko Anda --</option>';
        data.forEach(toko => {
            dropdown.innerHTML += `<option value="${toko.id}">${toko.nama_toko}</option>`;
        });
    } catch (err) {
        dropdown.innerHTML = '<option value="" disabled>Gagal memuat toko.</option>';
    }
}

// 2. Fungsi Utama Menyimpan Data & Foto
async function simpanProduk(event) {
    event.preventDefault();
    
    const btnSimpan = document.getElementById('btnSimpan');
    btnSimpan.innerText = "Mengupload Foto & Menyimpan...";
    btnSimpan.disabled = true;

    // Ambil semua data teks
    const idToko = document.getElementById('pilihToko').value;
    const nama = document.getElementById('namaProduk').value;
    const kategori = document.getElementById('kategoriProduk').value;
    const deskripsi = document.getElementById('deskripsiProduk').value;
    const harga = document.getElementById('hargaProduk').value;
    const varian = document.getElementById('varianProduk').value;
    
    // Ambil Status Stok (Radio button yang dipilih)
    const statusStok = document.querySelector('input[name="statusStok"]:checked').value;

    // Ambil Opsi Pengiriman (Checkbox yang dicentang), digabung pakai koma
    const checkboxes = document.querySelectorAll('.opsi-pengiriman:checked');
    let pengirimanArr = [];
    checkboxes.forEach((cb) => { pengirimanArr.push(cb.value); });
    const opsiPengiriman = pengirimanArr.join(', ');

    // Ambil File Foto
    const fileInput = document.getElementById('fotoFile');
    const file = fileInput.files[0];
    let fotoUrlFinal = "";

    try {
        // PROSES UPLOAD FOTO KE SUPABASE STORAGE
        if (file) {
            // Membuat nama file unik berdasarkan waktu saat ini
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;

            // Upload ke bucket 'foto_produk'
            const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('foto_produk')
                .upload(fileName, file);

            if (uploadError) {
                console.error("Gagal upload foto:", uploadError);
                throw new Error("Gagal mengupload foto. Pastikan ukuran gambar tidak terlalu besar.");
            }

            // Ambil URL publik dari foto yang baru diupload
            const { data: publicUrlData } = supabaseClient
                .storage
                .from('foto_produk')
                .getPublicUrl(fileName);
            
            fotoUrlFinal = publicUrlData.publicUrl;
        }

        // PROSES SIMPAN KE DATABASE
        const { error: dbError } = await supabaseClient
            .from('produk')
            .insert([
                { 
                    toko_id: idToko, 
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

        alert(`Berhasil! Produk "${nama}" sudah dilengkapi dengan foto asli dan masuk etalase.`);
        
        // Reset form setelah sukses
        document.getElementById('formProduk').reset();
        
    } catch (err) {
        console.error("Terjadi masalah:", err);
        alert(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
        btnSimpan.innerText = "Simpan & Upload Produk";
        btnSimpan.disabled = false;
    }
}

// Jalankan saat layar dibuka
muatDaftarToko();