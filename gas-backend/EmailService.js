/**
 * Walnut Valley Unified School District (WVUSD)
 * Email Notification Service
 * 
 * Dispatches styled notifications to comma-separated recipient lists
 * for approval workflow events and urgent medical alerts.
 */

var EmailService = {

  /**
   * Send notification to comma-separated recipients
   */
  send: function(rawRecipients, subject, htmlBody) {
    var emailList = parseEmailList(rawRecipients);
    if (emailList.length === 0) {
      console.log("No valid email recipients for subject: " + subject);
      return;
    }

    var cleanSubject = "[WVUSD Field Trips] " + subject;
    var toAddress = emailList.join(", ");

    try {
      MailApp.sendEmail({
        to: toAddress,
        subject: cleanSubject,
        htmlBody: htmlBody
      });
      console.log("Email dispatched to: " + toAddress + " | Subject: " + cleanSubject);
    } catch (e) {
      console.error("Failed to send email to " + toAddress + ": " + e.message);
    }
  },

  /**
   * Helper to build standard WVUSD branded email wrapper
   */
  wrapTemplate: function(title, preheader, bodyContent, ctaUrl, ctaText) {
    var ctaHtml = "";
    if (ctaUrl && ctaText) {
      ctaHtml = '<div style="text-align: center; margin: 30px 0;">' +
        '<a href="' + ctaUrl + '" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">' +
        ctaText + '</a></div>';
    }

    return '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 25px; color: #1f2937;">' +
      '<div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">' +
        '<div style="background-color: #1e3a8a; padding: 20px; text-align: center;">' +
          '<img src="' + CONFIG.LOGO_URL + '" alt="WVUSD Logo" style="height: 52px; width: auto; margin-bottom: 8px;" />' +
          '<h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">Walnut Valley Unified School District</h2>' +
          '<p style="color: #93c5fd; margin: 4px 0 0; font-size: 13px;">Field Trip & Permission Slip Management</p>' +
        '</div>' +
        '<div style="padding: 28px 24px;">' +
          '<h3 style="color: #1e3a8a; margin-top: 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">' + title + '</h3>' +
          '<p style="font-size: 14px; color: #6b7280; margin-top: 0;">' + preheader + '</p>' +
          '<div style="font-size: 14px; line-height: 1.6; color: #374151;">' + bodyContent + '</div>' +
          ctaHtml +
        '</div>' +
        '<div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">' +
          'This is an automated notification from the WVUSD Field Trip Portal.<br>' +
          'Walnut Valley Unified School District • 880 S. Lemon Ave., Walnut, CA 91789' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  /**
   * Notify approvers that a trip requires their review
   */
  notifyApproversForStage: function(recipients, requestData, stageName, appUrl) {
    var title = "Field Trip Review Required: " + requestData.Request_ID;
    var preheader = "Action required: " + stageName + " Approval";
    var content = 
      '<p>A field trip request has been submitted and is currently awaiting your review at the <strong>' + stageName + '</strong> stage.</p>' +
      '<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold; width: 35%;">Request ID:</td><td style="padding: 8px 12px;">' + requestData.Request_ID + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">School / Site:</td><td style="padding: 8px 12px;">' + requestData.Site + '</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Teacher in Charge:</td><td style="padding: 8px 12px;">' + requestData.Teacher_In_Charge + ' (' + requestData.Requester_Email + ')</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Group Name:</td><td style="padding: 8px 12px;">' + requestData.Group_Name + '</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Destination:</td><td style="padding: 8px 12px;">' + requestData.Destination + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Dates:</td><td style="padding: 8px 12px;">' + requestData.Departure_Date + ' to ' + requestData.Return_Date + '</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Trip Type:</td><td style="padding: 8px 12px;">' + requestData.Trip_Type + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Students / Volunteers:</td><td style="padding: 8px 12px;">' + requestData.Student_Count + ' students, ' + requestData.Volunteer_Count + ' volunteers</td></tr>' +
      '</table>' +
      '<p>Please log in to the WVUSD Field Trip Portal to review the details, supervision plans, roster, and approve or request changes.</p>';

    var html = this.wrapTemplate(title, preheader, content, appUrl, "Review & Approve Request");
    this.send(recipients, "Action Required: " + requestData.Request_ID + " - " + requestData.Destination, html);
  },

  /**
   * Notify substitute / delegated approver that a trip has been assigned to them
   */
  notifyDelegatedApprover: function(recipient, requestData, stageName, actorEmail, reason, appUrl) {
    var title = "Delegated Approval Assignment: " + requestData.Request_ID;
    var preheader = "You have been designated as acting approver for " + stageName;
    var content = 
      '<p>You have been assigned as the delegated / substitute approver for field trip request <strong>' + requestData.Request_ID + '</strong> at the <strong>' + stageName + '</strong> stage by <strong>' + actorEmail + '</strong>.</p>' +
      '<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 15px 0; border-radius: 4px;">' +
        '<strong style="color: #1e3a8a;">Reason / Coverage Note:</strong><br>' +
        '<span style="color: #1e40af; font-style: italic;">"' + (reason || "Administrative coverage assignment") + '"</span>' +
      '</div>' +
      '<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold; width: 35%;">Request ID:</td><td style="padding: 8px 12px;">' + requestData.Request_ID + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">School / Site:</td><td style="padding: 8px 12px;">' + requestData.Site + '</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Teacher in Charge:</td><td style="padding: 8px 12px;">' + requestData.Teacher_In_Charge + ' (' + requestData.Requester_Email + ')</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Group Name:</td><td style="padding: 8px 12px;">' + requestData.Group_Name + '</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Destination:</td><td style="padding: 8px 12px;">' + requestData.Destination + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Dates:</td><td style="padding: 8px 12px;">' + requestData.Departure_Date + ' to ' + requestData.Return_Date + '</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Trip Type:</td><td style="padding: 8px 12px;">' + requestData.Trip_Type + '</td></tr>' +
      '</table>' +
      '<p>Please log in to the WVUSD Field Trip Portal to review the trip details and submit your approval decision.</p>';

    var html = this.wrapTemplate(title, preheader, content, appUrl, "Review & Approve Request");
    this.send(recipient, "Delegated Review Required: " + requestData.Request_ID + " - " + requestData.Destination, html);
  },

  /**
   * Notify teacher that changes have been requested
   */
  notifyTeacherActionRequired: function(teacherEmails, requestData, actorEmail, comments, appUrl) {
    var title = "Action Required on Field Trip: " + requestData.Request_ID;
    var preheader = "Revision requested by " + actorEmail;
    var content = 
      '<p>An approver has reviewed your field trip request for <strong>' + requestData.Destination + '</strong> and requested updates before approval can proceed.</p>' +
      '<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 15px 0; border-radius: 4px;">' +
        '<strong style="color: #92400e;">Approver Comments (' + actorEmail + '):</strong><br>' +
        '<span style="color: #78350f; font-style: italic;">"' + (comments || "Please review request details and revise.") + '"</span>' +
      '</div>' +
      '<p>Your request has been unlocked for edits. Please update the necessary fields and resubmit the form to continue through the approval chain.</p>';

    var html = this.wrapTemplate(title, preheader, content, appUrl, "Edit and Resubmit Request");
    this.send(teacherEmails, "Changes Requested: " + requestData.Request_ID + " - " + requestData.Destination, html);
  },

  /**
   * Notify approvers that teacher has resubmitted their request
   */
  notifyResubmission: function(recipients, requestData, appUrl) {
    var title = "Field Trip Request Resubmitted: " + requestData.Request_ID;
    var preheader = "Teacher has updated and resubmitted the request";
    var content = 
      '<p>The teacher <strong>' + requestData.Teacher_In_Charge + '</strong> has made updates and resubmitted field trip request <strong>' + requestData.Request_ID + '</strong> (' + requestData.Destination + ').</p>' +
      '<p>It is now back in your review queue for ' + requestData.Current_Stage + '.</p>';

    var html = this.wrapTemplate(title, preheader, content, appUrl, "Review Updated Request");
    this.send(recipients, "Resubmitted: " + requestData.Request_ID + " - " + requestData.Destination, html);
  },

  /**
   * Notify parties of final approval
   */
  notifyFinalApproval: function(allRecipients, requestData, appUrl) {
    var title = "🎉 Field Trip Approved: " + requestData.Request_ID;
    var preheader = "All required district approvals have been granted";
    var content = 
      '<p>Congratulations! Field trip request <strong>' + requestData.Request_ID + '</strong> for <strong>' + requestData.Destination + '</strong> has received final approval from the Operations Director.</p>' +
      '<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold; width: 35%;">Destination:</td><td style="padding: 8px 12px;">' + requestData.Destination + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Departure Date:</td><td style="padding: 8px 12px;">' + requestData.Departure_Date + ' ' + requestData.Departure_Time + '</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Return Date:</td><td style="padding: 8px 12px;">' + requestData.Return_Date + ' ' + requestData.Return_Time + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Transportation:</td><td style="padding: 8px 12px;">' + requestData.Transportation_Type + '</td></tr>' +
      '</table>' +
      '<p>You can now manage parent and volunteer permission slips in the Staff Portal.</p>';

    var html = this.wrapTemplate(title, preheader, content, appUrl, "Open Staff Portal");
    this.send(allRecipients, "FINAL APPROVAL: " + requestData.Request_ID + " - " + requestData.Destination, html);
  },

  /**
   * Notify teacher of declined request
   */
  notifyDeclined: function(teacherEmails, requestData, actorEmail, reason, appUrl) {
    var title = "Field Trip Request Declined: " + requestData.Request_ID;
    var preheader = "Request declined by " + actorEmail;
    var content = 
      '<p>Field trip request <strong>' + requestData.Request_ID + '</strong> for <strong>' + requestData.Destination + '</strong> has been declined.</p>' +
      '<div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 15px 0; border-radius: 4px;">' +
        '<strong style="color: #991b1b;">Reason / Approver Notes (' + actorEmail + '):</strong><br>' +
        '<span style="color: #7f1d1d; font-style: italic;">"' + (reason || "No comment provided.") + '"</span>' +
      '</div>';

    var html = this.wrapTemplate(title, preheader, content, appUrl, "View Request");
    this.send(teacherEmails, "DECLINED: " + requestData.Request_ID + " - " + requestData.Destination, html);
  },

  /**
   * INSTANT NURSE ALERT
   * Triggered immediately when a parent permission slip specifies medical needs or medication
   */
  sendInstantNurseAlert: function(nurseEmails, slipData, tripData) {
    var title = "🚨 URGENT: Student Medical / Medication Alert on Field Trip";
    var preheader = "Medical attention required for student on upcoming trip";
    
    var content = 
      '<div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">' +
        '<strong style="color: #991b1b; font-size: 15px;">ACTION REQUIRED: Field Trip Medical Clearance</strong>' +
        '<p style="color: #7f1d1d; margin: 4px 0 0; font-size: 13px;">A parent has submitted a permission slip indicating active medical needs and/or required medication during an upcoming school-sponsored trip.</p>' +
      '</div>' +
      '<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold; width: 35%;">Student Name:</td><td style="padding: 8px 12px;"><strong>' + slipData.Student_First_Name + ' ' + slipData.Student_Last_Name + '</strong></td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Student ID (Lunch #):</td><td style="padding: 8px 12px;">' + slipData.Student_ID + '</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Assigned Teacher:</td><td style="padding: 8px 12px;">' + slipData.Assigned_Teacher + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Trip Destination:</td><td style="padding: 8px 12px;">' + tripData.Destination + ' (' + tripData.Request_ID + ')</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Trip Dates:</td><td style="padding: 8px 12px;">' + tripData.Departure_Date + ' to ' + tripData.Return_Date + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Has Medical Needs:</td><td style="padding: 8px 12px; color: ' + (slipData.Has_Medical_Needs === 'Yes' ? '#b91c1c; font-weight:bold;' : '#374151;') + '">' + slipData.Has_Medical_Needs + '</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Medical Details:</td><td style="padding: 8px 12px;">' + (slipData.Medical_Details || 'None stated') + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Requires Medication:</td><td style="padding: 8px 12px; color: ' + (slipData.Requires_Medication === 'Yes' ? '#b91c1c; font-weight:bold;' : '#374151;') + '">' + slipData.Requires_Medication + '</td></tr>' +
        '<tr style="background-color: #f9fafb;"><td style="padding: 8px 12px; font-weight: bold;">Medication Location:</td><td style="padding: 8px 12px;">' + (slipData.Medication_Location || 'N/A') + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold;">Parent Contact:</td><td style="padding: 8px 12px;">' + slipData.Parent_Phone + ' | ' + slipData.Parent_Email + '</td></tr>' +
      '</table>' +
      '<p>Please verify that the student has up-to-date physician authorization orders and appropriate medication kits on campus or prepared for this trip.</p>';

    var html = this.wrapTemplate(title, preheader, content, null, null);
    this.send(nurseEmails, "URGENT NURSE ALERT: Student Medical/Medication for Trip " + tripData.Request_ID + " (" + slipData.Student_First_Name + " " + slipData.Student_Last_Name + ")", html);
  }
};
