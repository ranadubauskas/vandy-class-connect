import PocketBase from 'pocketbase';

const pb = new PocketBase('https://vandy-class-connect.pockethost.io');
if (typeof pb.autoCancellation === 'function') {
    pb.autoCancellation(false);
}
export default pb;