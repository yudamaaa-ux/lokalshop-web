// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

let dataUserAktif = null; 
let idTokoAktif = null;   

// 1. CEK KEAMANAN & AMBIL PROFIL TOKO
async function cekKeamanan() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (!user || error) {
        window.location.href = 'login.html';
        return;
    }
    dataUserAktif = user;
    await ambilProfilToko();
}

// 2. AMBIL DATA TOKO & CEK VERIFIKASI
async function ambilProfilToko() {
    const { data, error } = await supabaseClient.from('toko').select('*').eq('user_id', dataUserAktif.id).single();

    // GEMBOK KEAMANAN:
    if (!data) {
        // Jika belum bikin toko sama sekali
        alert("Anda harus mendaftar buka toko terlebih dahulu.");
        window.location.href = 'profil-user.html';
        return;
    }

    if (data.status_verifikasi !== 'Disetujui') {
        // Jika masih Menunggu atau Ditolak
        alert("Toko Anda belum disetujui atau sedang dalam proses verifikasi Admin.");
        window.location.href = 'profil-user.html';
        return;
    }

    // Jika lolos (Disetujui), jalankan dashboard seperti biasa
    idTokoAktif = data.id;
    document.getElementById('namaToko').value = data.nama_toko || '';
    document.getElementById('waToko').value = data.no_whatsapp || '';
    document.getElementById('teksNamaToko').innerText = data.nama_toko || 'Toko Baru';
    document.getElementById('teksWaToko').innerText = data.no_whatsapp || 'Belum ada WA';
    
    ambilProdukKu(); 
    ambilPesananMasuk(); 
}

async function simpanProfilToko(event) {
    event.preventDefault();
    const nama = document.getElementById('namaToko').value;
    const wa = document.getElementById('waToko').value;
    
    if (idTokoAktif) {
        await supabaseClient.from('toko').update({nama_toko: nama, no_whatsapp: wa}).eq('id', idTokoAktif);
    } else {
        await supabaseClient.from('toko').insert([{user_id: dataUserAktif.id, nama_toko: nama, no_whatsapp: wa}]);
    }
    alert("Profil Tersimpan!");
    ambilProfilToko();
}

// 2. FUNGSI UPLOAD FOTO KE SUPABASE
async function unggahSatuFoto(fileInputId) {
    const fileField = document.getElementById(fileInputId);
    if (!fileField || fileField.files.length === 0) return null; 

    const file = fileField.files[0];
    const fileExt = file.name.split('.').pop();
    const namaUnik = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const pathFile = `katalog/${namaUnik}`; 

    const { error } = await supabaseClient.storage.from('foto-produk').upload(pathFile, file);
    if (error) throw new Error(`Gagal mengunggah foto (${fileInputId}). Pastikan ukuran di bawah 2MB.`);

    const { data: publicUrlData } = supabaseClient.storage.from('foto-produk').getPublicUrl(pathFile);
    return publicUrlData.publicUrl;
}

// 3. SIMPAN PRODUK LENGKAP
async function simpanProdukPro(event) {
    event.preventDefault();
    if (!idTokoAktif) { alert("Simpan profil toko dulu (di kolom kiri) sebelum tambah produk!"); return; }

    const tombolSimpan = event.target.querySelector('button[type="submit"]');
    const teksAsli = tombolSimpan.innerHTML;
    tombolSimpan.innerHTML = "⏳ Mengunggah Data & Foto...";
    tombolSimpan.disabled = true;

    try {
        // Upload foto berurutan (bisa jadi null jika tidak diisi)
        const f1 = await unggahSatuFoto('foto1');
        const f2 = await unggahSatuFoto('foto2');
        const f3 = await unggahSatuFoto('foto3');
        const f4 = await unggahSatuFoto('foto4');
        const f5 = await unggahSatuFoto('foto5');

        if (!f1) throw new Error("Foto Utama (Foto 1) wajib diunggah!");

        // Kumpulkan data lengkap dari form
        const dataProdukBaru = {
            user_id: dataUserAktif.id,
            toko_id: idTokoAktif,
            
            // Media
            foto1: f1, foto2: f2, foto3: f3, foto4: f4, foto5: f5,
            
            // Informasi
            nama_produk: document.getElementById('namaProduk').value,
            kategori: document.getElementById('kategori').value,
            merek: document.getElementById('merek').value || null,
            sku: document.getElementById('sku').value || null,
            deskripsi: document.getElementById('deskripsi').value,
            
            // Harga & Stok
            harga_normal: parseInt(document.getElementById('hargaNormal').value),
            harga_diskon: parseInt(document.getElementById('hargaDiskon').value) || 0,
            stok: parseInt(document.getElementById('stok').value) || 0,
            min_pembelian: parseInt(document.getElementById('minBeli').value) || 1,
            
            // Pengiriman (Berat & Dimensi)
            berat: parseInt(document.getElementById('berat').value) || 0,
            panjang: parseInt(document.getElementById('panjang').value) || 0,
            lebar: parseInt(document.getElementById('lebar').value) || 0,
            tinggi: parseInt(document.getElementById('tinggi').value) || 0,
            
            // Pengaturan
            izinkan_wa: document.getElementById('izinWa').checked,
            izinkan_keranjang: document.getElementById('izinKeranjang').checked,
            izinkan_cod: document.getElementById('izinCod').checked,
            terima_retur: document.getElementById('terimaRetur').checked,
            
            status_tampil: 'Aktif'
        };

        const { error } = await supabaseClient.from('produk').insert([dataProdukBaru]);
        if (error) throw error;

        alert("🎉 Produk super lengkap Anda berhasil diterbitkan!");
        document.getElementById('formProdukPro').reset();
        ambilProdukKu(); 

    } catch (error) {
        alert("Kesalahan: " + error.message);
        console.error(error);
    } finally {
        tombolSimpan.innerHTML = teksAsli;
        tombolSimpan.disabled = false;
    }
}

// 4. TAMPILKAN TABEL KATALOG
async function ambilProdukKu() {
    if (!idTokoAktif) return;
    const { data, error } = await supabaseClient.from('produk').select('*').eq('toko_id', idTokoAktif).order('created_at', { ascending: false });

    const tbody = document.getElementById('tabelProdukKu');
    tbody.innerHTML = '';

    if (error || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-gray-500">Belum ada produk.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const hargaRp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.harga_normal);
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 flex items-center gap-3">
                    <img src="${item.foto1}" class="w-10 h-10 rounded-lg object-cover bg-gray-100">
                    <div>
                        <p class="font-bold text-gray-800 text-sm">${item.nama_produk}</p>
                        <p class="text-[10px] text-gray-500">SKU: ${item.sku || '-'}</p>
                    </div>
                </td>
                <td class="px-6 py-4 font-bold text-green-600 text-sm">${hargaRp}</td>
                <td class="px-6 py-4">
                    <span class="${item.stok > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'} px-2.5 py-1 rounded-full text-[10px] font-bold">
                        ${item.stok} Pcs
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="hapusProduk('${item.id}')" class="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition">Hapus</button>
                </td>
            </tr>
        `;
    });
}

// 5. HAPUS PRODUK
async function hapusProduk(idProduk) {
    if (!confirm("Yakin ingin menghapus produk ini dari katalog?")) return;
    const { error } = await supabaseClient.from('produk').delete().eq('id', idProduk);
    if (!error) ambilProdukKu();
}

async function keluarAkun() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// ==========================================
// FITUR BARU: MANAJEMEN PESANAN PENJUAL
// ==========================================

// 1. Ambil Data Pesanan Masuk
async function ambilPesananMasuk() {
    if (!idTokoAktif) return;

    const { data, error } = await supabaseClient
        .from('pesanan')
        .select('*')
        .eq('toko_id', idTokoAktif)
        .order('created_at', { ascending: false });

    const tbody = document.getElementById('tabelPesananMasuk');
    tbody.innerHTML = '';

    if (error || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-gray-500 font-bold">Belum ada pesanan masuk.</td></tr>`;
        return;
    }

    data.forEach(order => {
        const tgl = new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const totalRp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.total_harga);
        
        // Warna label status
        let warnaStatus = 'bg-yellow-100 text-yellow-700';
        if (order.status_pesanan === 'Diproses') warnaStatus = 'bg-blue-100 text-blue-700';
        if (order.status_pesanan === 'Dikirim') warnaStatus = 'bg-purple-100 text-purple-700';
        if (order.status_pesanan === 'Selesai') warnaStatus = 'bg-green-100 text-green-700';
        if (order.status_pesanan === 'Dibatalkan') warnaStatus = 'bg-red-100 text-red-700';

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4">
                    <p class="font-bold text-gray-800 text-xs">${tgl}</p>
                    <p class="text-[10px] text-gray-400">ID: ${order.id.substring(0,8)}...</p>
                </td>
                <td class="px-6 py-4 font-black text-green-600">${totalRp}</td>
                <td class="px-6 py-4">
                    <span class="${warnaStatus} px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                        ${order.status_pesanan}
                    </span>
                </td>
                <td class="px-6 py-4 text-right flex justify-end gap-2">
                    <select onchange="ubahStatusPesanan('${order.id}', this.value)" class="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white outline-none cursor-pointer focus:ring-1 focus:ring-blue-500">
                        <option value="" disabled selected>Ubah...</option>
                        <option value="Menunggu Konfirmasi">Menunggu</option>
                        <option value="Diproses">Diproses</option>
                        <option value="Dikirim">Dikirim</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Dibatalkan">Batalkan</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

// 2. Fungsi Mengubah Status ke Database
async function ubahStatusPesanan(idPesanan, statusBaru) {
    if (!statusBaru) return;
    
    // Tampilkan loading sebentar
    document.body.style.cursor = 'wait';
    
    const { error } = await supabaseClient
        .from('pesanan')
        .update({ status_pesanan: statusBaru })
        .eq('id', idPesanan);

    document.body.style.cursor = 'default';

    if (error) {
        alert("Gagal mengubah status pesanan.");
        console.error(error);
    } else {
        // Refresh tabel pesanan jika berhasil
        ambilPesananMasuk();
    }
}

cekKeamanan();