// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

// Keranjang belanja dalam bentuk Array
let keranjang = [];

// 1. FUNGSI MENAMPILKAN PRODUK KE BERANDA
async function tampilkanProduk() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    grid.innerHTML = '<p class="text-center col-span-2 text-gray-500 py-10">Memuat produk dari etalase...</p>';

    try {
        const { data, error } = await supabaseClient
            .from('produk')
            .select('*, toko(id, nama_toko, no_whatsapp, alamat_rt_rw)')
            .order('id', { ascending: false });

        if (error) throw error;

        if (data.length === 0) {
            grid.innerHTML = '<p class="text-center col-span-2 text-gray-500 py-10">Belum ada produk yang dijual.</p>';
            return;
        }

        let html = '';
        data.forEach(item => {
            const foto = item.foto_url || 'https://via.placeholder.com/300x200?text=Tanpa+Foto';
            const namaToko = item.toko ? item.toko.nama_toko : 'Toko Lokal';
            const noWA = item.toko ? item.toko.no_whatsapp : '';
            const lokasi = item.toko ? item.toko.alamat_rt_rw : '';

            let badgeColor = item.status_stok === 'Ready Stock' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
            let labelStok = item.status_stok ? `<span class="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded shadow-sm ${badgeColor}">${item.status_stok}</span>` : '';

            html += `
            <div class="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition flex flex-col">
                <div class="h-40 bg-gray-100 w-full relative">
                    <img src="${foto}" alt="${item.nama_produk}" class="w-full h-full object-cover">
                    ${labelStok}
                </div>
                <div class="p-3 flex flex-col flex-grow">
                    <p class="text-xs text-gray-500 mb-1">📍 ${namaToko} (${lokasi})</p>
                    <h4 class="font-bold text-sm mb-1 line-clamp-2">${item.nama_produk}</h4>
                    <p class="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">${item.kategori_produk || 'Umum'}</p>
                    
                    <div class="mt-auto pt-3 border-t border-dashed flex justify-between items-center">
                        <span class="font-bold text-green-600 text-sm">Rp ${Number(item.harga).toLocaleString('id-ID')}</span>
                        <button onclick='tambahKeKeranjang(${JSON.stringify(item)})' class="bg-green-100 text-green-700 px-3 py-1.5 rounded-md hover:bg-green-600 hover:text-white transition text-xs font-bold">
                            + Keranjang
                        </button>
                    </div>
                </div>
            </div>
            `;
        });

        grid.innerHTML = html;
    } catch (err) {
        console.error("Gagal mengambil data:", err);
        grid.innerHTML = '<p class="text-center col-span-2 text-red-500 py-10">Gagal memuat produk. Cek koneksi Anda.</p>';
    }
}

// 2. FUNGSI TAMBAH KE KERANJANG
function tambahKeKeranjang( produk ) {
    const ada = keranjang.find(item => item.id === produk.id);
    if (ada) {
        ada.jumlah += 1;
    } else {
        keranjang.push({ ...produk, jumlah: 1 });
    }
    updateBadgeKeranjang();
    alert(`"${produk.nama_produk}" berhasil dimasukkan ke keranjang!`);
}

// 3. UPDATE ANGKA DI ICON KERANJANG
function updateBadgeKeranjang() {
    const badge = document.getElementById('badgeKeranjang');
    if (badge) {
        const totalItem = keranjang.reduce((sum, item) => sum + item.jumlah, 0);
        badge.innerText = totalItem;
    }
}

// 4. MODAL ATAU TAMPILAN KERANJANG (Opsional interaktif)
// Anda bisa melanjutkannya dengan membuat fungsi checkout WhatsApp langsung ke nomor penjual per toko.

// Jalankan saat pertama buka
tampilkanProduk();