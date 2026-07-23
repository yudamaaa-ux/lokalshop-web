// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

let semuaProduk = [];

// 1. NAVIGASI DINAMIS & NOTIFIKASI BADGE KERANJANG
async function cekStatusLogin() {
    const tempatMenu = document.getElementById('menuNavigasi');
    if (!tempatMenu) return;

    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();

        let badgeHtml = '';
        if (user) {
            const { count } = await supabaseClient
                .from('keranjang')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            
            if (count && count > 0) {
                badgeHtml = `<span class="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">${count}</span>`;
            }
        }

        if (user) {
            tempatMenu.innerHTML = `
                <a href="keranjang.html" class="flex items-center gap-1 text-gray-600 hover:text-green-600 text-sm font-bold transition mr-1 relative">
                    🛒 <span class="hidden md:inline">Keranjang</span> ${badgeHtml}
                </a>
                <a href="profil-user.html" class="flex items-center gap-1 text-gray-600 hover:text-green-600 text-sm font-bold transition">
                    👤 <span class="hidden md:inline">Akun</span>
                </a>
                <a href="dashboard.html" class="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-1 ml-2">
                    🏪 <span class="hidden md:inline">Toko</span>
                </a>
            `;
        } else {
            tempatMenu.innerHTML = `
                <a href="keranjang.html" class="flex items-center gap-1 text-gray-600 hover:text-green-600 text-sm font-bold transition mr-2">
                    🛒 Keranjang
                </a>
                <a href="login.html" class="text-gray-500 hover:text-green-600 text-sm font-bold transition px-2">Daftar</a>
                <a href="login.html" class="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-green-700 transition">Masuk</a>
            `;
        }
    } catch (err) {
        console.error("Gagal cek login:", err);
        tempatMenu.innerHTML = `<a href="login.html" class="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md">Masuk</a>`;
    }
}

// 2. KATEGORI CEPAT
function filterKategoriCepat(namaKategori) {
    const inputKategori = document.getElementById('kategoriCari');
    if (inputKategori) {
        inputKategori.value = namaKategori;
        filterProduk();
    }
}

// 3. AMBIL PRODUK DARI DATABASE
async function ambilProduk() {
    const tempatKatalog = document.getElementById('katalogProduk');
    if (!tempatKatalog) return;

    try {
        const { data, error } = await supabaseClient
            .from('produk')
            .select(`
                id, nama_produk, kategori, harga_normal, harga_diskon, stok, foto1, toko_id,
                toko ( id, nama_toko )
            `)
            .eq('status_tampil', 'Aktif')
            .order('created_at', { ascending: false });

        if (error) throw error;
        semuaProduk = data || [];
        tampilkanProduk(semuaProduk);
    } catch (err) {
        console.error("Gagal memuat katalog:", err);
        tempatKatalog.innerHTML = `<p class="col-span-full text-center text-red-500 font-bold">Gagal memuat produk. Periksa koneksi internet Anda.</p>`;
    }
}

// 4. TAMPILKAN PRODUK KE LAYAR
function tampilkanProduk(dataProduk) {
    const tempatKatalog = document.getElementById('katalogProduk');
    if (!tempatKatalog) return;
    tempatKatalog.innerHTML = '';

    if (dataProduk.length === 0) {
        tempatKatalog.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10 font-bold">Maaf, belum ada produk yang tersedia.</p>`;
        return;
    }

    dataProduk.forEach(item => {
        const hrgDiskon = item.harga_diskon || 0;
        const hrgNormal = item.harga_normal || 0;
        const hrgTampil = hrgDiskon > 0 ? hrgDiskon : hrgNormal;
        
        const hargaRp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(hrgTampil);
        const namaToko = item.toko ? item.toko.nama_toko : 'Toko Lokal';
        const idToko = item.toko_id || (item.toko ? item.toko.id : '#');
        const fotoTampil = item.foto1 || 'https://via.placeholder.com/300x200?text=Tanpa+Foto';

        let badgeHabis = item.stok <= 0 ? `<div class="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-sm tracking-widest">HABIS</div>` : '';
        let badgeDiskon = hrgDiskon > 0 ? `<div class="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">DISKON</div>` : '';

        tempatKatalog.innerHTML += `
            <a href="detail.html?id=${item.id}" class="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden flex flex-col h-full cursor-pointer hover:border-green-300 relative">
                <div class="h-40 overflow-hidden bg-gray-100 relative">
                    <img src="${fotoTampil}" alt="${item.nama_produk}" class="w-full h-full object-cover">
                    ${badgeDiskon}
                    ${badgeHabis}
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <div class="text-[10px] font-bold text-green-600 mb-1 uppercase tracking-wider">${item.kategori || 'Lainnya'}</div>
                    <h3 class="font-bold text-gray-800 line-clamp-2 mb-1 text-sm">${item.nama_produk}</h3>
                    
                    <div class="text-base font-black text-gray-900 mt-2">${hargaRp}</div>
                    ${hrgDiskon > 0 ? `<div class="text-[10px] text-gray-400 line-through mt-0.5">Rp${hrgNormal.toLocaleString('id-ID')}</div>` : ''}
                    
                    <!-- TOMBOL TOKO BARU YANG LEBIH BESAR -->
                    <div class="mt-auto pt-3 border-t border-gray-50">
                        <button onclick="event.stopPropagation(); window.location.href='toko.html?id=${idToko}'" class="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-all border border-indigo-100 shadow-sm w-full">
                            🏪 Kunjungi Toko
                        </button>
                    </div>
                </div>
            </a>
        `;
    });
}

// 5. PENCARIAN & FILTER
function filterProduk() {
    const inputCari = document.getElementById('kolomCari');
    const inputKategori = document.getElementById('kategoriCari');
    if (!inputCari || !inputKategori) return;

    const kataKunci = inputCari.value.toLowerCase();
    const kategoriDipilih = inputKategori.value;

    const produkTersaring = semuaProduk.filter(item => {
        const nama = item.nama_produk ? item.nama_produk.toLowerCase() : '';
        const cocokNama = nama.includes(kataKunci);
        const cocokKategori = (kategoriDipilih === "Semua") || (item.kategori === kategoriDipilih);
        return cocokNama && cocokKategori;
    });

    tampilkanProduk(produkTersaring);
}

// Jalankan sistem saat halaman dibuka
cekStatusLogin();
ambilProduk();