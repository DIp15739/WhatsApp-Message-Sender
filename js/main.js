var codeInput = $("#code");
var phoneInput = $("#phone");
var textInput = $("#text");
var sendBtn = $("#send");
var codeError = $("#code-error");
var PhoneError = $("#phone-error");

// set input to number only
$(".numberOnly").keypress((e) => {
  if (e.keyCode < 48 || e.keyCode > 57) {
    e.preventDefault();
    return false;
  }
});
$(".numberOnly").on("paste", (e) => {
  var value = e.originalEvent.clipboardData.getData("Text");
  if (value.match(/[^\d]/)) {
    e.preventDefault();
    return false;
  }
});

// fix + sign to code
codeInput.on("input", (e) => {
  value = e.target.value.replace(/[//++]/g, "");
  e.target.value = "+" + value;
});

//validate code and phone no
function validCode() {
  var code = codeInput.val().replace(/[//++]/g, "");
  if (!/[0-9]{1,3}/.test(code)) {
    codeError.text("Enter valid country code.");
    return false;
  }
  codeError.text("");
  return true;
}

function validPhoneNo() {
  var phoneNo = phoneInput.val();
  if (!/[0-9]{10}/.test(phoneNo)) {
    PhoneError.text("Enter valid Phone number.");
    return false;
  }
  PhoneError.text("");
  return true;
}

// check valid on blur

codeInput.on("blur", validCode);
phoneInput.on("blur", validPhoneNo);

// add send btn link
sendBtn.click((e) => {
  if (!validCode() || !validPhoneNo()) return false;

  var code = codeInput.val().replace(/[//++]/g, "");
  var phoneNo = phoneInput.val();
  var text = textInput.val();
  text = encodeURIComponent(text);
  console.log(text);
  //   return false;
  var phone = code + phoneNo;
  var url = "https://api.whatsapp.com/send?phone=" + phone + "&text=" + text;
  sendBtn.attr("href", url);
});
