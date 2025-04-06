let current_song = new Audio();
let songs
let shuffleEnabled = false;
let repeatEnabled = false; // Flag to track repeat mode
const repeatElement = document.getElementById('repeat');

async function fetchData() {
    try {
        const res = await fetch('/songs/songs.json');
        if (!res.ok) throw new Error('Could not load songs.json');
        songs = await res.json();
        return songs;
    } catch (err) {
        console.error('Error loading songs:', err);
        return [];
    }
}
fetchData();

function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    
    let formattedMinutes = String(minutes).padStart(2, '0');
    let formattedSeconds = String(secs).padStart(2, '0');
    
    return `${formattedMinutes}:${formattedSeconds}`;
}

const playMusic = (track, pause=false) => {
    const details = track.split('.mp3')[0]
    current_song.src = '/songs/' + track;
    if(!pause) {
        current_song.play();
        document.getElementById("play_icon").title = "Pause";
        play_icon.src = 'icons/pause.svg';
    }
    document.querySelector('.description').innerHTML = decodeURI(details);
    document.querySelector('.current-time').innerHTML = '00:00';
    current_song.addEventListener('loadedmetadata', () => {
        document.querySelector('.overall-time').innerHTML = formatDuration(current_song.duration);
    });

    // 🔹 Remove 'playing' class from all songs
    document.querySelectorAll('.playlist ul li').forEach(li => li.classList.remove('playing'));

    // 🔹 Find and highlight the currently playing song
    document.querySelectorAll('.playlist ul li').forEach(li => {
        let songName = li.querySelector('.song-name').textContent;
        let songArtist = li.querySelector('.song-artist').textContent;
        let liTrack = `${songName} - ${songArtist}.mp3`;

        if (liTrack === track) {
            li.classList.add('playing'); // Add class for the currently playing song
        }
    });

    // 🔹 Dispatch event so other parts of the app know a song changed
    document.dispatchEvent(new CustomEvent('songChanged', { detail: { track: track } }));
};

async function main() {
    songs = await fetchData();
    playMusic(songs[0], true)

    let songUL = document.querySelector('.playlist').getElementsByTagName('ul' )[0];
    for (let song of songs) {
        let song_info = (song.replaceAll('%20', ' ')).split('.mp3')[0];
        let song_name = song_info.split(' - ')[0];
        let song_artist = song_info.split(' - ')[1];

        let li = document.createElement('li');
        li.className = 'lst';
        li.innerHTML = `
            <div class="song-info flex">
                <div class="title-box flex">
                    <div class="playnow">
                        <img class="invert" src="icons/play.svg" alt="play" title="Play">
                    </div>
                    <div class="song-name">${song_name}</div>
                </div>
                <div class="song-artist">${song_artist}</div>
                <div class="song-duration"></div>
            </div>
        `;
        songUL.appendChild(li);

        // Load the audio file to get its duration
        let audio = new Audio(`http://127.0.0.1:3000/songs/${song}`);
        audio.addEventListener('loadedmetadata', () => {
            let duration = formatDuration(audio.duration);
            li.querySelector('.song-duration').textContent = duration;
        });
    }

    Array.from(document.querySelector('.playlist').getElementsByTagName('li')).forEach(x => {
        x.addEventListener('click', () => {
            let song_name = x.querySelector('.song-name').textContent;
            let song_artist = x.querySelector('.song-artist').textContent;
            playMusic(`${song_name} - ${song_artist}.mp3`);
        })
    })
    

    play_pause.addEventListener('click', () => {
        if (current_song.paused) {
            current_song.play();
            document.getElementById("play_icon").title = "Pause";
            play_icon.src = 'icons/pause.svg';
        }
        else {
            current_song.pause();;
            document.getElementById("play_icon").title = "Play";
            play_icon.src = 'icons/play.svg';
        }
    })

    // Duration Time - Update function
    current_song.addEventListener('timeupdate', () => {
        document.querySelector('.current-time').innerHTML = `${formatTime(current_song.currentTime)}`
        document.querySelector('.pointer').style.left = (current_song.currentTime / current_song.duration * 100) + '%';
    })

    // Adding an event listener to seekbar
    document.querySelector('.seekbar').addEventListener('click', x => {
        let percent = (x.offsetX/x.target.getBoundingClientRect().width * 100)
        document.querySelector('.pointer').style.left = percent + '%'
        current_song.currentTime = current_song.duration * percent / 100
    })

    // Hamburger button
    document.querySelector('.hamburger').addEventListener('click', () => {
        document.querySelector('.sidebar').style.left = '0'
    })
    // Close button
    document.querySelector('.hamburger-close').addEventListener('click', () => {
        document.querySelector('.sidebar').style.left = '-200%'
    })

    // Shuffle Button
    document.getElementById('shuffle').addEventListener('click', () => {
        shuffleEnabled = !shuffleEnabled; // Toggle shuffle mode
        document.getElementById('shuffle').classList.toggle('active', shuffleEnabled); // Add a visual indicator if needed
    });

    // Previous button 
    previous.addEventListener('click', () => {
        let curr = decodeURIComponent(current_song.src.split('/').slice(-1)[0]);
        let index = songs.indexOf(curr)
        if(index-1 >= 0) {
            playMusic(songs[index-1])
        }
    })

    // Next button
    next.addEventListener('click', () => {
    let curr = decodeURIComponent(current_song.src.split('/').slice(-1)[0]);
    let index = songs.indexOf(curr);
    console.log('Next button clicked');
    console.log('Current song:', curr);
    console.log('Index in songs list:', index);
    console.log('Songs list:', songs);

    if (shuffleEnabled) {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * songs.length);
        } while (randomIndex === index);
        playMusic(songs[randomIndex]);
    } else {
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            console.log('Reached end of playlist, nothing to play.');
        }
    }
});

    // Volume Mixer
    document.querySelector('.range').getElementsByTagName('input')[0].addEventListener('change', (x) => {
        current_song.volume = parseInt(x.target.value) / 100
    })

    // Repeat Button Click Event
    repeatElement.addEventListener('click', () => {
        repeatEnabled = !repeatEnabled; // Toggle repeat mode
        repeatElement.classList.toggle('active', repeatEnabled); // Add visual effect
    });

    // Event Listener: When song ends, check repeat mode
    current_song.addEventListener('ended', () => {
        if (repeatEnabled) {
            current_song.currentTime = 0; // Restart song
            current_song.play(); // Play again
        } else {
            // Normal next song logic
            let curr = decodeURIComponent(current_song.src.split('/').slice(-1)[0]);
            let index = songs.indexOf(curr);
            if (index + 1 < songs.length) {
                playMusic(songs[index + 1]);
            }
        }
    });

}

// Helper function to format the duration in minutes and seconds
function formatDuration(seconds) {
    let minutes = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

main();