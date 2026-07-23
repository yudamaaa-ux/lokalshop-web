// --- KONFIGURASI SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = 'https://snclpxrtxjwefzrmkylo.supabase.co'; 
const supabaseKey = 'sb_publishable_Sw_2GbforFsxCsf8zIwDJw_a3XuRnjl';
const supabaseClient = createClient(supabaseUrl, supabaseKey);
// ----------------------------

// 1. CEK OTOMATIS: Jika sudah login, tendang ke halaman tambah produk
async function cekSudahLogin() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        window.location.href = "profil-user.html"; // Redirect otomatis
    }
}
cekSudahLogin(); // Jalankan saat halaman dibuka

// 2. FUNGSI LIHAT/SEMBUNYIKAN PASSWORD
function togglePassword() {
    const inputPassword = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (inputPassword.type === "password") {
        inputPassword.type = "text";
        // Ganti ikon menjadi mata dicoret
        eyeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />`;
    } else {
        inputPassword.type = "password";
        // Ganti ikon kembali menjadi mata terbuka
        eyeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />`;
    }
}

// 3. FUNGSI UBAH MODE (Login/Daftar)
function ubahModeAuth() {
    const mode = document.getElementById('modeAuth');
    const judul = document.getElementById('judulForm');
    const deskripsi = document.getElementById('deskripsiForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const teksPeralihan = document.getElementById('teksPeralihan');
    const kotakError = document.getElementById('kotakError');

    // Sembunyikan error saat ganti mode
    kotakError.classList.add('hidden'); 

    if (mode.value === 'login') {
        mode.value = 'register';
        judul.innerText = 'Buat Akun Baru';
        deskripsi.innerText = 'Daftarkan email Anda untuk membuka LOKAL SHOP.';
        btnSubmit.innerText = 'Daftar Sekarang';
        teksPeralihan.innerHTML = 'Sudah punya akun? <button onclick="ubahModeAuth()" type="button" class="text-green-600 font-bold hover:underline">Masuk di sini</button>';
    } else {
        mode.value = 'login';
        judul.innerText = 'Masuk ke Akun';
        deskripsi.innerText = 'Silakan masuk untuk mengelola LOKAL SHOP Anda.';
        btnSubmit.innerText = 'Masuk Sekarang';
        teksPeralihan.innerHTML = 'Belum punya akun? <button onclick="ubahModeAuth()" type="button" class="text-green-600 font-bold hover:underline">Daftar secara gratis</button>';
    }
}

// 4. FUNGSI TAMPILKAN PESAN ERROR
function tampilkanError(pesan) {
    const kotakError = document.getElementById('kotakError');
    kotakError.innerText = pesan;
    kotakError.classList.remove('hidden'); // Munculkan kotak merah
}

// 5. FUNGSI UTAMA (SUBMIT FORM)
async function prosesAuth(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mode = document.getElementById('modeAuth').value;
    const btnSubmit = document.getElementById('btnSubmit');
    const kotakError = document.getElementById('kotakError');

    // Sembunyikan pesan error lama (jika ada) dan ubah teks tombol
    kotakError.classList.add('hidden');
    btnSubmit.innerText = "Memproses...";
    btnSubmit.disabled = true;

    try {
        if (mode === 'register') {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });
            if (error) throw error;
            
            alert("Berhasil mendaftar! Anda akan diarahkan untuk melengkapi profil toko.");
            window.location.href = "daftar.html"; 

        } else {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) throw error;

            window.location.href = "tambah-produk.html"; 
        }
    } catch (error) {
        console.error("Error Auth:", error);
        // Tampilkan pesan error di kotak merah, bukan pop-up
        if (error.message.includes("Invalid login")) {
            tampilkanError("Email atau Password salah. Silakan periksa kembali.");
        } else if (error.message.includes("already registered")) {
            tampilkanError("Email ini sudah terdaftar. Silakan gunakan menu Masuk.");
        } else {
            tampilkanError("Terjadi kesalahan: " + error.message);
        }
    } finally {
        btnSubmit.innerText = mode === 'register' ? 'Daftar Sekarang' : 'Masuk Sekarang';
        btnSubmit.disabled = false;
    }
}
// 6. FUNGSI LOGIN DENGAN GOOGLE
async function loginDenganGoogle() {
    try {
        const kotakError = document.getElementById('kotakError');
        kotakError.classList.add('hidden');
        
        // Memanggil fitur Google OAuth bawaan Supabase
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/profil-user.html'
            }
        });

        if (error) throw error;
        
    } catch (error) {
        console.error("Error Google Login:", error);
        tampilkanError("Fitur Login Google sedang disiapkan. Sementara gunakan formulir email di atas.");
    }
}