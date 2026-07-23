// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

let dataProdukSaatIni = null;
const urlParams = new URLSearchParams(window.location.search);
const idProduk = urlParams.get('id');

async function muatDetailProduk() {
    if (!idProduk) {
        alert("Produk tidak ditemukan!");
        window.location.href = 'index.html';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('produk')
            .select('*, toko (nama_toko, no_whatsapp)')
            .eq('id', idProduk)
            .single();

        if (error || !data) throw error;
        
        dataProdukSaatIni = data;
        tampilkanData(data);

    } catch (err) {
        console.error(err);
        document.getElementById('loading').innerText = "Gagal memuat detail produk.";
    }
}

function tampilkanData(item) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('kontenDetail').classList.remove('hidden');
    document.getElementById('kontenDetail').classList.add('md:flex');

    document.getElementById('namaProduk').innerText = item.nama_produk;
    document.getElementById('labelKategori').innerText = item.kategori;
    document.getElementById('labelStok').innerText = `Stok: ${item.stok > 0 ? item.stok : 'Habis'}`;
    document.getElementById('deskripsiProduk').innerText = item.deskripsi;
    document.getElementById('beratProduk').innerText = item.berat || 0;
    document.getElementById('skuProduk').innerText = item.sku || '-';
    document.getElementById('namaToko').innerText = item.toko ? item.toko.nama_toko : 'Toko Tidak Diketahui';

    const hrgDiskon = item.harga_diskon || 0;
    const hrgNormal = item.harga_normal;
    const hargaTampil = hrgDiskon > 0 ? hrgDiskon : hrgNormal;
    
    document.getElementById('hargaProduk').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(hargaTampil);
    
    if (hrgDiskon > 0) {
        document.getElementById('hargaCoret').classList.remove('hidden');
        document.getElementById('hargaCoret').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(hrgNormal);
    }

    document.getElementById('fotoUtama').src = item.foto1;
    let galeriHtml = '';
    const daftarFoto = [item.foto1, item.foto2, item.foto3, item.foto4, item.foto5];
    
    daftarFoto.forEach(url => {
        if (url) {
            galeriHtml += `
                <div onclick="gantiFotoUtama('${url}')" class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500 cursor-pointer bg-gray-100 transition">
                    <img src="${url}" class="w-full h-full object-cover">
                </div>
            `;
        }
    });
    document.getElementById('galeriFoto').innerHTML = galeriHtml;
}

function gantiFotoUtama(url) {
    document.getElementById('fotoUtama').src = url;
}

// FUNGSI BARU: SIMPAN KE DATABASE KERANJANG
async function masukkanKeKeranjang() {
    // 1. Pastikan pembeli sudah login
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert("Silakan Masuk/Daftar terlebih dahulu untuk berbelanja.");
        window.location.href = 'login.html';
        return;
    }

    if (!dataProdukSaatIni) return;
    if (dataProdukSaatIni.stok <= 0) {
        alert("Maaf, stok produk ini sedang habis.");
        return;
    }

    const hargaPakai = dataProdukSaatIni.harga_diskon > 0 ? dataProdukSaatIni.harga_diskon : dataProdukSaatIni.harga_normal;
    const qty = 1; // Default beli 1

    const dataKeranjang = {
        user_id: user.id,
        produk_id: dataProdukSaatIni.id,
        toko_id: dataProdukSaatIni.toko_id,
        qty: qty,
        harga: hargaPakai,
        subtotal: hargaPakai * qty
    };

    // 2. Tembak ke database Supabase
    const { error } = await supabaseClient.from('keranjang').insert([dataKeranjang]);
    
    if (error) {
        console.error("Gagal menambahkan ke keranjang:", error);
        alert("Gagal menambahkan ke keranjang.");
    } else {
        alert("Berhasil ditambahkan ke keranjang!");
        // Otomatis ubah tombol jadi teks sukses sesaat
        event.target.innerText = "✓ Dimasukkan";
        setTimeout(() => event.target.innerText = "+ Keranjang", 2000);
    }
}

function beliLangsungWA() {
    if (!dataProdukSaatIni) return;
    const tokoWa = dataProdukSaatIni.toko ? dataProdukSaatIni.toko.no_whatsapp : '628123456789';
    const pesan = `Halo ${dataProdukSaatIni.toko.nama_toko}, saya tertarik untuk membeli:\n\n*${dataProdukSaatIni.nama_produk}*\n\nApakah stoknya masih tersedia?`;
    window.open(`https://wa.me/${tokoWa}?text=${encodeURIComponent(pesan)}`, '_blank');
}

muatDetailProduk();