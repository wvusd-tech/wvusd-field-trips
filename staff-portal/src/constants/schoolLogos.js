/**
 * Walnut Valley Unified School District (WVUSD)
 * Official School Mascot Logos & District Branding
 */

export const DISTRICT_SHIELD_LOGO = "https://res.cloudinary.com/djv9u4054/image/upload/v1793111822/Vintage_Retro_Automotive_Garage_Service_Badge_Logo_2_qcefb6.png";
export const DISTRICT_DEFAULT_LOGO = "https://res.cloudinary.com/djv9u4054/image/upload/v1783959106/UPdated_Black_and_White_Logo-removebg-preview_zubeqp.png";

export const SCHOOL_LOGOS = {
  "Diamond Bar High School": "https://res.cloudinary.com/djv9u4054/image/upload/v1783632852/0-DBARBRAHMASWide_q8uled-removebg-preview_x7ta88.png",
  "South Pointe Middle School": "https://res.cloudinary.com/djv9u4054/image/upload/v1783623577/copy_of_copy_of_spt_logo-removebg-preview_l7eve6.png",
  "Maple Hill Elementary": "https://res.cloudinary.com/djv9u4054/image/upload/v1783459666/copy_of_untitled_design_6_qhbikx.png",
  "Chaparral Middle School": "https://res.cloudinary.com/djv9u4054/image/upload/v1781797508/CHP_Logo-removebg-preview_npea0e.png",
  "Suzanne Middle School": "https://res.cloudinary.com/djv9u4054/image/upload/v1780597225/Suzanne_iqsuyo.png",
  "Walnut High School": "https://res.cloudinary.com/djv9u4054/image/upload/v1780504988/stickerwhs_iwwwxs_rx0om9.png",
  "Ron Hockwalt Academies": "https://res.cloudinary.com/djv9u4054/image/upload/v1777564560/Untitled_design_4_tjyhnp.png",
  "Collegewood Elementary": "https://res.cloudinary.com/djv9u4054/image/upload/v1777485387/Untitled_design_14_on26t9.png",
  "Vejar Elementary": "https://res.cloudinary.com/djv9u4054/image/upload/v1777485064/Untitled_design_13_ohnd95.png",
  "Castle Rock Elementary": "https://res.cloudinary.com/djv9u4054/image/upload/v1777486030/Untitled_design_15_dt6zmq.png",
  "Evergreen Elementary": "https://res.cloudinary.com/djv9u4054/image/upload/v1777484631/Untitled_design_12_le66tp.png",
  "Quail Summit Elementary": "https://res.cloudinary.com/djv9u4054/image/upload/v1777484271/Untitled_design_11_bd8mmm.png",
  "Walnut Elementary": "https://res.cloudinary.com/djv9u4054/image/upload/v1777483405/Untitled_design_10_imwook.png",
  "Westhoff Elementary": "https://res.cloudinary.com/djv9u4054/image/upload/v1777482954/Untitled_design_9_pkf2df.png",
  "CJ Morris Elementary": "https://res.cloudinary.com/djv9u4054/image/upload/v1777482304/Untitled_design_7_kyzokr.png"
};

export const SITE_ADDRESSES = {
  "Castle Rock Elementary": "2975 Castle Rock Rd, Diamond Bar, CA 91765",
  "Collegewood Elementary": "20725 Collegewood Dr., Walnut, CA 91789",
  "CJ Morris Elementary": "19875 Calle Baja, Walnut, CA 91789",
  "Evergreen Elementary": "2450 Evergreen Springs Drive, Diamond Bar, CA 91765",
  "Maple Hill Elementary": "1350 Maple Hill Rd, Diamond Bar, CA 91765",
  "Quail Summit Elementary": "23330 Quail Summit Drive, Diamond Bar, CA 91765",
  "Vejar Elementary": "20222 Vejar Road, Walnut, CA 91789",
  "Walnut Elementary": "841 S. Glenwick, Walnut, CA 91789",
  "Westhoff Elementary": "20151 Amar Road, Walnut, CA 91789",
  "Chaparral Middle School": "1405 S. Spruce Tree Dr., Diamond Bar, CA 91765",
  "South Pointe Middle School": "20671 Larkstone Dr., Diamond Bar, CA 91789",
  "Suzanne Middle School": "525 Suzanne Road, Walnut, CA 91789",
  "Diamond Bar High School": "21400 Pathfinder Road, Diamond Bar, CA 91765",
  "Walnut High School": "400 N. Pierre Road, Walnut, CA 91789",
  "Ron Hockwalt Academies": "476 Lemon Ave, Walnut, CA 91789",
  "HARTT": "476 Lemon Ave, Walnut, CA 91789"
};

/**
 * Returns matching school logo by site name
 */
export function getSchoolLogo(siteName) {
  if (!siteName) return DISTRICT_DEFAULT_LOGO;
  const clean = siteName.trim().toLowerCase();
  for (const [name, url] of Object.entries(SCHOOL_LOGOS)) {
    if (name.toLowerCase() === clean || clean.includes(name.toLowerCase())) {
      return url;
    }
  }
  return DISTRICT_DEFAULT_LOGO;
}
