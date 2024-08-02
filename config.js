import fs from 'fs';

/// 歌曲文件所在目录
const musicPath = 'D:/music_tf';
/// 输出文件所在目录
const outputPath = 'D:/music_tf/output';

/// 无损音乐格式
const lossless = ['.flac', '.ape', '.wav', '.aiff', '.alac', '.wv', '.tak', '.tta', '.m4a'];
/// 有损音乐格式
const lossy = ['.mp3', '.aac', '.ogg', '.wma', '.ra', '.rm', '.rmvb', '.opus'];
/// 无损音乐目标格式
const losslessFormat = '.flac';
/// 有损音乐目标格式
const lossyFormat = '.mp3';

/// 艺术家分隔符
const artistSeparators = ['/', ';', ','];

/// 检查路径是否存在，不存在则创建
const checkPath = (path, autoCreate = false) => {
    try {
        if (!fs.existsSync(path)) {
            if (!autoCreate) {
                return false;
            }
            fs.mkdirSync(path, { recursive: true });
        }
        return true;
    } catch (error) {
        console.error('路径创建失败', error.message);
    }
    return false;
}

if (!checkPath(musicPath) || !checkPath(outputPath, true)) {
    console.error('路径不存在，程序退出');
    process.exit(1);
}

export default {
    musicPath, outputPath, lossless, lossy, losslessFormat, lossyFormat, artistSeparators
};