# @shipgirl/node-stream-isobmff

This library only does enough to do decryption of cenc encrypted audio, and only functions in a Node.js compatible environment (requires Buffer, Node.js streams).

If you want an actually good ISOBMFF/MP4 parser use [mp4box.js](https://github.com/gpac/mp4box.js).

If you want an actually good MP4 decryption library with browser support use [shifro](https://github.com/azot-labs/shifro).

### Notes
- OpenSSL version Node.js is using dropped support for aes-128-ctr long ago (unless --openssl-legacy-provider flag is used), so [@noble/ciphers](https://github.com/paulmillr/noble-ciphers) is used

- Potential for performance improvement using [aes-ctr-concurrent](https://github.com/Rychu-Pawel/aes-ctr-concurrent), since it support streams, can rework to decrypt fragments on the fly instead of full fragments.
