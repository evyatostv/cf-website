export const BUCKET = Deno.env.get('INSTALLERS_BUCKET') || 'installers';

export const INSTALLER_PATHS: Record<string, string> = {
  win: 'ClinicFlow-Setup.exe',
  mac: 'ClinicFlow-Setup.dmg',
  linux: 'ClinicFlow-Setup.AppImage',
};
