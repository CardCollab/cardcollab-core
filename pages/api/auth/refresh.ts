import nanoid from "nanoid";
import {
  compareSecret,
  getRefreshToken,
  getAccessToken,
} from "util/authServer";
import { NextApiRequest, NextApiResponse } from "next";
import { getUserByEmail, getUserByID } from "util/db/user";
import {
  getUserAuth,
  createDevice,
  updateUserAuthLocal,
  getDevice,
  updateDevice,
} from "util/db/auth";
import geoip from "geoip-lite";

const refresh = async (req: NextApiRequest, res: NextApiResponse) => {
  // get sub, deviceID and refreshToken from request
  var device = null;
  try {
    device = await getDevice(req.body.sub, req.body.deviceID);
  } catch (err) {
    return res.status(400).send(err.message);
  }

  if (device.refreshToken != req.body.refreshToken)
    return res.status(400).send("Incorrect refresh token");

  const user = await getUserByID(req.body.sub);

  const ip = req.connection.remoteAddress;
  const refreshToken = getRefreshToken(128);
  const accessToken = getAccessToken(user.sub, user.role, 60);
  const expiresAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    await updateDevice(user.sub, req.body.deviceID, {
      lastSeen: new Date().toISOString(),
      lastIP: ip,
      refreshToken,
      expiresAt,
    });
  } catch (err) {
    throw err;
  }

  res.send({ deviceID: req.body.deviceID, refreshToken, accessToken });
};

export default refresh;
