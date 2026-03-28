import { FuzzySuggestModal, type App, type TFile } from "obsidian";

/**
 * 파일 선택 모달.
 * Import 시 vault 내 .md 파일을 퍼지 검색으로 선택한다.
 */
export class FileSuggestModal extends FuzzySuggestModal<TFile> {
  private files: TFile[];
  private onSelect: (file: TFile) => void;

  constructor(app: App, files: TFile[], onSelect: (file: TFile) => void) {
    super(app);
    this.files = files;
    this.onSelect = onSelect;
    this.setPlaceholder("Import할 마크다운 파일을 선택하세요...");
  }

  getItems(): TFile[] {
    return this.files;
  }

  getItemText(item: TFile): string {
    return item.path;
  }

  onChooseItem(item: TFile, _evt: MouseEvent | KeyboardEvent): void {
    this.onSelect(item);
  }
}
