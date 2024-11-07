import PocketBase from 'pocketbase';

const pb = new PocketBase('https://vandy-class-connect.pockethost.io');
pb.autoCancellation(false);

export default pb;