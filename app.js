let keranjang = [];
let aktifTokoId = null;
let aktifTokoWA = "";
let aktifTokoNama = "";

// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;

// URL dasar (tanpa /rest/v1/)
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 

// Menggunakan publishable/anon key
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';

const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

// Buka/Tutup Keranjang
function toggleCart() {
    const modal = document.getElementById('cartModal');
    modal.classList.toggle('hidden');
}

// Tambah produk ke keranjang
function tambahKeKeranjang(idProduk, namaProduk, harga, idToko, namaToko, noWA) {
    // Mencegah campur toko
    if (keranjang.length > 0 && aktifTokoId !== idToko) {
        alert(`Gagal! Keranjang Anda masih berisi produk dari ${aktifTokoNama}. Selesaikan pesanan itu dulu atau hapus dari keranjang.`);
        return; 
    }

    // Set toko jika keranjang kosong
    if (keranjang.length === 0) {
        aktifTokoId = idToko;
        aktifTokoNama = namaToko;
        aktifTokoWA = noWA;
    }

    // Cek produk dobel
    const produkAda = keranjang.find(item => item.id === idProduk);
    if (produkAda) {
        produkAda.qty += 1;
    } else {
        keranjang.push({ id: idProduk, nama: namaProduk, harga: harga, qty: 1 });
    }

    renderKeranjangUI();
    
    // Memberi tahu pengguna produk berhasil masuk
    alert(`${namaProduk} berhasil ditambahkan! Silakan cek ikon keranjang di kanan atas.`);
}

// Menampilkan isi keranjang di layar
function renderKeranjangUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    let totalItem = keranjang.reduce((sum, item) => sum + item.qty, 0);
    cartCount.innerText = totalItem;

    if (keranjang.length === 0) {
        cartItems.innerHTML = '<p class="text-center text-gray-400 text-sm italic mt-5">Keranjang masih kosong</p>';
        cartTotal.innerText = 'Rp 0';
        aktifTokoId = null; 
        return;
    }

    let htmlIsi = '';
    let grandTotal = 0;

    keranjang.forEach((item, index) => {
        const subTotal = item.harga * item.qty;
        grandTotal += subTotal;
        
        htmlIsi += `
            <div class="flex justify-between items-center mb-2 text-sm border-b pb-2">
                <div>
                    <p class="font-bold">${item.nama}</p>
                    <p class="text-gray-500">${item.qty} x Rp ${item.harga.toLocaleString('id-ID')}</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-bold">Rp ${subTotal.toLocaleString('id-ID')}</span>
                    <button onclick="hapusItem(${index})" class="text-red-500"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });

    cartItems.innerHTML = htmlIsi;
    cartTotal.innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
}

// Hapus item dari keranjang
function hapusItem(index) {
    keranjang.splice(index, 1);
    renderKeranjangUI();
}

// Tombol hijau "Checkout via WA" diklik
// Tombol hijau "Checkout via WA" diklik
async function prosesCheckoutWA() {
    if (keranjang.length === 0) {
        alert("Keranjang masih kosong!");
        return;
    }

    let grandTotal = 0;
    let teksPesanan = `Halo *${aktifTokoNama}*, saya ingin memesan:\n\n`;

    keranjang.forEach(item => {
        const subTotal = item.harga * item.qty;
        grandTotal += subTotal;
        teksPesanan += `- ${item.nama} (${item.qty}x) = Rp ${subTotal.toLocaleString('id-ID')}\n`;
    });

    teksPesanan += `\n*Total Belanja: Rp ${grandTotal.toLocaleString('id-ID')}*\n\n`;
    teksPesanan += `Mohon info untuk pengiriman dan pembayarannya. (Pesanan via LOKAL SHOP)`;

    const potonganLayanan = grandTotal * 0.01;

    // -- INI ADALAH KODE UNTUK MENGIRIM DATA KE SUPABASE YANG TERLEWAT --
    try {
        console.log("Sedang mencatat transaksi ke database...");
        const { data, error } = await supabaseClient
            .from('transaksi_log')
            .insert([
                { 
                    total_belanja: grandTotal, 
                    potongan_layanan: potonganLayanan,
                    metode_pembayaran: 'WA Direct'
                }
            ]);

        if (error) {
            console.error("Error dari Supabase:", error);
            // Tetap lanjut ke WA meskipun gagal catat, agar pembeli tidak terhambat
        } else {
            console.log("Berhasil mencatat ke Supabase!");
        }
    } catch (err) {
        console.error("Gagal koneksi:", err);
    }
    // -------------------------------------------------------------------

    // Buka WhatsApp
    const urlWA = `https://wa.me/${aktifTokoWA}?text=${encodeURIComponent(teksPesanan)}`;
    window.open(urlWA, '_blank');
    
    // Bersihkan keranjang setelah terkirim
    keranjang = [];
    renderKeranjangUI();
    toggleCart();
}
// -- FUNGSI MENARIK DATA PRODUK DARI DATABASE --
async function tampilkanProduk() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '<p class="text-center col-span-2 text-gray-500 py-10">Memuat produk dari database...</p>';

    try {
        const { data, error } = await supabaseClient
            .from('produk')
            .select('*, toko(nama_toko, no_whatsapp, alamat_rt_rw)');

        if (error) throw error;

        if (data.length === 0) {
            grid.innerHTML = '<p class="text-center col-span-2 text-gray-500 py-10">Belum ada produk yang dijual.</p>';
            return;
        }

        let html = '';
        data.forEach(item => {
            const foto = item.foto_url || 'https://via.placeholder.com/300x200?text=No+Image';
            const namaToko = item.toko.nama_toko;
            const noWA = item.toko.no_whatsapp;
            const lokasi = item.toko.alamat_rt_rw;

            // KODE HTML DI BAWAH INILAH YANG MEMBUAT TAMPILAN KOTAK PRODUK
            html += `
            <div class="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition">
                <div class="h-40 bg-gray-200 w-full object-cover">
                    <img src="${foto}" alt="${item.nama_produk}" class="w-full h-full object-cover">
                </div>
                <div class="p-3">
                    <p class="text-xs text-gray-500 mb-1"><i class="fas fa-map-marker-alt text-red-400 mr-1"></i>${namaToko} (${lokasi})</p>
                    <h4 class="font-bold text-sm mb-2 line-clamp-2">${item.nama_produk}</h4>
                    <div class="flex justify-between items-center mt-2">
                        <span class="font-bold text-green-600 text-sm">Rp ${item.harga.toLocaleString('id-ID')}</span>
                        <button onclick="tambahKeKeranjang('${item.id}', '${item.nama_produk}', ${item.harga}, '${item.toko_id}', '${namaToko}', '${noWA}')" class="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-600 hover:text-white transition">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
            `;
        });

        // Menyuntikkan HTML ke dalam website
        grid.innerHTML = html;
    } catch (err) {
        console.error("Gagal mengambil data:", err);
        grid.innerHTML = '<p class="text-center col-span-2 text-red-500 py-10">Gagal memuat produk. Cek koneksi Anda.</p>';
    }
}

// Menjalankan fungsi
tampilkanProduk();