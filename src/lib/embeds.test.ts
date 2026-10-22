import { describe, expect, it } from "vitest";
import {
  ehTipoDeBloco,
  lerAudio,
  lerConteudo,
  lerDrive,
  lerForms,
  lerLink,
  lerUrlHttps,
  lerYoutube,
} from "./embeds";

const ID = "dQw4w9WgXcQ";
const EMBED = `https://www.youtube-nocookie.com/embed/${ID}`;

describe("lerUrlHttps", () => {
  it("aceita https", () => {
    expect(lerUrlHttps("  https://exemplo.com/a ")?.href).toBe(
      "https://exemplo.com/a",
    );
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    " javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://exemplo.com",
    "ftp://exemplo.com",
    "file:///etc/passwd",
    "//exemplo.com",
    "exemplo.com",
    "https://usuario:senha@exemplo.com",
    "",
    "não é link",
  ])("recusa %s", (link) => {
    expect(lerUrlHttps(link)).toBeNull();
  });
});

describe("lerYoutube", () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=42s`,
    `https://m.youtube.com/watch?list=abc&v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=xyz`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}?feature=share`,
  ])("lê %s", (link) => {
    expect(lerYoutube(link)).toEqual({ tipo: "youtube", id: ID, src: EMBED });
  });

  it.each([
    `http://www.youtube.com/watch?v=${ID}`,
    `javascript:alert('https://youtu.be/${ID}')`,
    "https://www.youtube.com/watch?v=curto",
    `https://www.youtube.com/watch?v=${ID}x`,
    "https://www.youtube.com/watch",
    `https://www.youtube.com/channel/${ID}`,
    `https://www.youtube.com/shorts/${ID}/extra`,
    `https://youtube.com.golpe.com/watch?v=${ID}`,
    `https://golpe.com/watch?v=${ID}`,
    "https://youtu.be/",
  ])("recusa %s", (link) => {
    expect(lerYoutube(link)).toBeNull();
  });
});

describe("lerDrive", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUv";
  const esperado = {
    tipo: "drive",
    id,
    src: `https://drive.google.com/file/d/${id}/preview`,
    baixar: `https://drive.google.com/uc?export=download&id=${id}`,
  };

  it.each([
    `https://drive.google.com/file/d/${id}/view?usp=sharing`,
    `https://drive.google.com/file/d/${id}`,
    `https://drive.google.com/file/d/${id}/preview`,
    `https://drive.google.com/open?id=${id}`,
    `https://drive.google.com/uc?id=${id}&export=download`,
  ])("lê %s", (link) => {
    expect(lerDrive(link)).toEqual(esperado);
  });

  it.each([
    `http://drive.google.com/file/d/${id}/view`,
    `https://drive.google.com.golpe.com/file/d/${id}/view`,
    `https://docs.google.com/file/d/${id}/view`,
    "https://drive.google.com/file/d/",
    "https://drive.google.com/file/d/curto/view",
    "https://drive.google.com/open",
    "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp",
    `javascript:alert('https://drive.google.com/open?id=${id}')`,
  ])("recusa %s", (link) => {
    expect(lerDrive(link)).toBeNull();
  });
});

describe("lerForms", () => {
  const base = "https://docs.google.com/forms/d/e/1FAIpQLSabc_123";

  it("troca o marcador pelo e-mail e liga embedded", () => {
    const resultado = lerForms(
      `${base}/viewform?usp=pp_url&entry.123=EMAIL_DO_ALUNO`,
      "ana@exemplo.com",
    );
    expect(resultado).toEqual({
      tipo: "forms",
      src: `${base}/viewform?usp=pp_url&entry.123=ana%40exemplo.com&embedded=true`,
    });
  });

  it("mantém o marcador quando não há e-mail", () => {
    const resultado = lerForms(`${base}/viewform?entry.1=EMAIL_DO_ALUNO`);
    expect(resultado).toEqual({
      tipo: "forms",
      src: `${base}/viewform?entry.1=EMAIL_DO_ALUNO&embedded=true`,
    });
  });

  it("não deixa o e-mail injetar outros campos", () => {
    const resultado = lerForms(
      `${base}/viewform?entry.1=EMAIL_DO_ALUNO`,
      "a&entry.2=x@exemplo.com",
    );
    expect(resultado).toEqual({
      tipo: "forms",
      src: `${base}/viewform?entry.1=a%26entry.2%3Dx%40exemplo.com&embedded=true`,
    });
  });

  it.each([
    [`${base}/edit`, `${base}/viewform?embedded=true`],
    [`${base}`, `${base}/viewform?embedded=true`],
    [`${base}/`, `${base}/viewform?embedded=true`],
    [`${base}/viewform?embedded=false`, `${base}/viewform?embedded=true`],
    [`${base}/viewform#topo`, `${base}/viewform?embedded=true`],
    [
      "https://docs.google.com/forms/d/1AbCdEf/edit",
      "https://docs.google.com/forms/d/1AbCdEf/viewform?embedded=true",
    ],
  ])("normaliza %s", (link, src) => {
    expect(lerForms(link)).toEqual({ tipo: "forms", src });
  });

  it("transforma forms.gle em botão", () => {
    expect(lerForms("https://forms.gle/AbC123xyz", "ana@exemplo.com")).toEqual({
      tipo: "forms-botao",
      url: "https://forms.gle/AbC123xyz",
    });
  });

  it.each([
    `http://docs.google.com/forms/d/e/1FAIpQLSabc/viewform`,
    "https://docs.google.com/document/d/1AbC/edit",
    "https://docs.google.com/forms/d/e/1FAIpQLSabc/formResponse",
    "https://docs.google.com.golpe.com/forms/d/e/1FAIpQLSabc/viewform",
    "https://forms.gle/",
    "https://forms.gle/a/b",
    "http://forms.gle/AbC123",
    "javascript:alert(1)//https://docs.google.com/forms/d/e/x/viewform",
  ])("recusa %s", (link) => {
    expect(lerForms(link)).toBeNull();
  });
});

describe("lerAudio", () => {
  it("usa o visualizador do Drive para arquivos do Drive", () => {
    expect(
      lerAudio("https://drive.google.com/file/d/1AbCdEfGhIjK/view")?.tipo,
    ).toBe("drive");
  });

  it("toca outros links https direto", () => {
    expect(lerAudio("https://exemplo.com/playback.mp3")).toEqual({
      tipo: "audio",
      src: "https://exemplo.com/playback.mp3",
    });
  });

  it.each(["http://exemplo.com/a.mp3", "javascript:alert(1)"])(
    "recusa %s",
    (link) => {
      expect(lerAudio(link)).toBeNull();
    },
  );
});

describe("lerLink", () => {
  it("aceita https", () => {
    expect(lerLink("https://exemplo.com/cifra")).toEqual({
      tipo: "link",
      url: "https://exemplo.com/cifra",
    });
  });

  it.each(["javascript:alert(1)", "http://exemplo.com", "mailto:a@b.com"])(
    "recusa %s",
    (link) => {
      expect(lerLink(link)).toBeNull();
    },
  );
});

describe("lerConteudo", () => {
  it("escolhe a leitura pelo tipo do bloco", () => {
    expect(lerConteudo("youtube", `https://youtu.be/${ID}`)?.tipo).toBe(
      "youtube",
    );
    expect(lerConteudo("drive", `https://youtu.be/${ID}`)).toBeNull();
    expect(
      lerConteudo(
        "prova",
        "https://docs.google.com/forms/d/e/x/viewform?entry.1=EMAIL_DO_ALUNO",
        "b@c.com",
      ),
    ).toEqual({
      tipo: "forms",
      src: "https://docs.google.com/forms/d/e/x/viewform?entry.1=b%40c.com&embedded=true",
    });
    expect(lerConteudo("texto", "https://exemplo.com")).toBeNull();
  });
});

describe("ehTipoDeBloco", () => {
  it("aceita só os tipos conhecidos", () => {
    expect(ehTipoDeBloco("prova")).toBe(true);
    expect(ehTipoDeBloco("html")).toBe(false);
    expect(ehTipoDeBloco(undefined)).toBe(false);
  });
});
